<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') - {{ config('app.name') }}</title>
    {{-- Self-contained on purpose: error pages must still work if the build assets are the problem. --}}
    <style>
        *{box-sizing:border-box}
        body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f5f2ec;color:#1a1a1a;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
        .card{width:100%;max-width:460px;background:#fff;border:1px solid #e6e1d6;border-radius:14px;padding:40px 32px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        .bar{width:40px;height:4px;border-radius:4px;background:#e1b44c;margin:0 auto 20px}
        h1{font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:28px;margin:0 0 12px}
        p{margin:0 0 24px;color:#6b665c;font-size:15px;line-height:1.6}
        .actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        a,button{font:inherit;font-size:14px;font-weight:500;border-radius:8px;padding:11px 20px;text-decoration:none;cursor:pointer}
        .primary{background:#e1b44c;color:#1a1a1a;border:1px solid #e1b44c}
        .secondary{background:#fff;color:#1a1a1a;border:1px solid #d8d2c4}
    </style>
</head>
<body>
    <main class="card">
        <div class="bar"></div>
        <h1>@yield('heading')</h1>
        <p>@yield('message')</p>
        <div class="actions">
            <a class="primary" href="{{ url('/') }}">Go to home page</a>
            <button class="secondary" type="button" onclick="history.length > 1 ? history.back() : location.reload()">Go back</button>
        </div>
    </main>
</body>
</html>
