<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Get all notifications for authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::with('seminar')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'message' => 'Notifications retrieved successfully',
            'data' => $notifications
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->unread()
            ->count();

        return response()->json([
            'message' => 'Unread count retrieved successfully',
            'data' => ['count' => $count]
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'data' => $notification->fresh()
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return response()->json([
            'message' => 'All notifications marked as read'
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted successfully'
        ]);
    }
}
