<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CacheResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, int $minutes = 5): Response
    {
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Create cache key based on URL and user ID
        $userId = $request->user()?->id ?? 'guest';
        $cacheKey = 'api_response:' . $userId . ':' . md5($request->fullUrl());

        // Try to get cached response
        $cachedResponse = Cache::get($cacheKey);

        if ($cachedResponse !== null) {
            return response()->json($cachedResponse)
                ->header('X-Cache', 'HIT');
        }

        // Process request
        $response = $next($request);

        // Cache successful JSON responses
        if ($response->isSuccessful() && $response->headers->get('Content-Type') === 'application/json') {
            $content = json_decode($response->getContent(), true);
            Cache::put($cacheKey, $content, now()->addMinutes($minutes));
            
            $response->header('X-Cache', 'MISS');
        }

        return $response;
    }
}
