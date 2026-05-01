<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: ../login.php');
    exit;
}

$currentUser = [
    'id' => $_SESSION['user_id'],
    'nombre' => $_SESSION['user_name'],
    'email' => $_SESSION['user_email'],
    'rol' => $_SESSION['user_role']
];

function requireRole($roles) {
    global $currentUser;
    if (!in_array($currentUser['rol'], (array)$roles)) {
        header('Location: ../index.php');
        exit;
    }
}
?>
