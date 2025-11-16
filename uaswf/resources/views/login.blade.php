<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body>
    <div class="login-wrapper">
        <div class="login-box">
            <div class="login-header">
                <h2>Login</h2>
            </div>
            <form class="login-form" method="POST">
                <div class="input-group">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="masukkan email">
                </div>
                <div class="input-group">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="masukkan password">
                </div>
                <button type="submit" class="btn-submit">Masuk</button>
            </form>
        </div>
    </div>
</body>
</html>
