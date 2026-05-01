<?php
session_start();

if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once 'config/database.php';
    
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $error = 'Complete todos los campos';
    } else {
        $stmt = $pdo->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['nombre'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_role'] = $user['rol'];
            header('Location: index.php');
            exit;
        } else {
            $error = 'Email o contraseña incorrectos';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - FreshStock</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --verde: #22c55e;
            --verde-dark: #16a34a;
            --naranja: #f97316;
            --amarillo: #eab308;
            --rojo: #ef4444;
            --gris-900: #111827;
            --gris-100: #f3f4f6;
            --gris-200: #e5e7eb;
            --gris-400: #9ca3af;
            --gris-500: #6b7280;
            --gris-600: #4b5563;
        }

        body {
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--gris-900);
            position: relative;
            overflow: hidden;
        }

        body::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
                radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.06) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.04) 0%, transparent 60%);
        }

        .login-wrapper {
            position: relative;
            z-index: 1;
            display: flex;
            width: 90%;
            max-width: 800px;
            min-height: 480px;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
        }

        .login-left {
            flex: 1;
            background: linear-gradient(135deg, var(--verde-dark), var(--verde), #10b981);
            padding: 3rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        .login-left::before {
            content: '';
            position: absolute;
            top: -30%;
            right: -30%;
            width: 80%;
            height: 80%;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
        }

        .login-left::after {
            content: '';
            position: absolute;
            bottom: -20%;
            left: -20%;
            width: 60%;
            height: 60%;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
        }

        .login-left-content { position: relative; z-index: 1; }

        .login-left h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: white;
            margin-bottom: 0.5rem;
        }

        .login-left p {
            color: rgba(255,255,255,0.85);
            font-size: 1rem;
            margin-bottom: 2rem;
        }

        .login-roles {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .login-role {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(255,255,255,0.15);
            padding: 0.65rem 0.85rem;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .login-role:hover { background: rgba(255,255,255,0.25); }

        .login-role-icon {
            font-size: 1.5rem;
            width: 36px;
            height: 36px;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-role-name {
            font-weight: 600;
            color: white;
            font-size: 0.9rem;
        }

        .login-role-desc {
            font-size: 0.72rem;
            color: rgba(255,255,255,0.7);
        }

        .login-right {
            flex: 1;
            background: white;
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
        }

        .login-right h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--gris-900);
            margin-bottom: 0.25rem;
        }

        .login-right > p {
            color: var(--gris-500);
            font-size: 0.85rem;
            margin-bottom: 2rem;
        }

        .error-msg {
            background: var(--rojo-light, #fef2f2);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: var(--rojo);
            padding: 0.75rem 1rem;
            border-radius: 10px;
            margin-bottom: 1.5rem;
            font-size: 0.85rem;
            text-align: center;
        }

        .form-group { margin-bottom: 1.25rem; }

        .form-group label {
            display: block;
            color: var(--gris-600);
            font-size: 0.82rem;
            font-weight: 600;
            margin-bottom: 0.4rem;
        }

        .form-group input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--gris-100);
            border: 2px solid transparent;
            border-radius: 10px;
            color: var(--gris-900);
            font-size: 0.95rem;
            transition: all 0.2s;
        }

        .form-group input:focus {
            outline: none;
            border-color: var(--verde);
            background: white;
        }

        .btn-login {
            width: 100%;
            padding: 0.85rem;
            background: var(--verde);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 0.5rem;
        }

        .btn-login:hover {
            background: var(--verde-dark);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
        }

        .pass-hint {
            text-align: center;
            margin-top: 1.5rem;
            padding-top: 1.25rem;
            border-top: 1px solid var(--gris-200);
            font-size: 0.78rem;
            color: var(--gris-400);
        }

        .pass-hint strong { color: var(--gris-600); }

        @media (max-width: 768px) {
            .login-wrapper { flex-direction: column; max-width: 400px; }
            .login-left { padding: 2rem; }
            .login-left h1 { font-size: 1.8rem; }
            .login-roles { flex-direction: row; flex-wrap: wrap; }
            .login-role { flex: 1; min-width: 140px; }
            .login-right { padding: 1.5rem; }
        }
    </style>
</head>
<body>
    <div class="login-wrapper">
        <div class="login-left">
            <div class="login-left-content">
                <h1>FreshStock</h1>
                <p>Control de inventario perecible</p>
                <div class="login-roles">
                    <div class="login-role" onclick="fillLogin('dueno@freshstock.com', 'password')">
                        <div class="login-role-icon">👑</div>
                        <div>
                            <div class="login-role-name">Dueño</div>
                            <div class="login-role-desc">Dashboard y KPIs</div>
                        </div>
                    </div>
                    <div class="login-role" onclick="fillLogin('admin@freshstock.com', 'password')">
                        <div class="login-role-icon">📂</div>
                        <div>
                            <div class="login-role-name">Administrador</div>
                            <div class="login-role-desc">Categorías y ganancias</div>
                        </div>
                    </div>
                    <div class="login-role" onclick="fillLogin('encargado@freshstock.com', 'password')">
                        <div class="login-role-icon">📦</div>
                        <div>
                            <div class="login-role-name">Encargado</div>
                            <div class="login-role-desc">Inventario y productos</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="login-right">
            <h2>Iniciar Sesión</h2>
            <p>Ingresa tus credenciales para continuar</p>

            <?php if ($error): ?>
                <div class="error-msg"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <form method="POST">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="usuario@freshstock.com">
                </div>
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn-login">Ingresar</button>
            </form>

            <div class="pass-hint">
                Contraseña de prueba: <strong>password</strong>
            </div>
        </div>
    </div>

    <script>
        function fillLogin(email, pass) {
            document.getElementById('email').value = email;
            document.getElementById('password').value = pass;
            document.getElementById('email').focus();
        }
    </script>
</body>
</html>
