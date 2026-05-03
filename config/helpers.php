<?php
// Helpers para compatibilidad MySQL/PostgreSQL
require_once 'database.php';

$db_type = getenv('DB_TYPE') ?: 'mysql';
$is_pgsql = ($db_type === 'pgsql');

function curdate() {
    global $is_pgsql;
    return $is_pgsql ? 'CURRENT_DATE' : 'CURDATE()';
}

function date_add($interval_days) {
    global $is_pgsql;
    return $is_pgsql ? "CURRENT_DATE + INTERVAL '{$interval_days}' DAYS" : "DATE_ADD(CURDATE(), INTERVAL {$interval_days} DAY)";
}

function datediff($col1, $col2) {
    global $is_pgsql;
    return $is_pgsql ? "({$col1} - {$col2})" : "DATEDIFF({$col1}, {$col2})";
}

function last_insert_id() {
    global $is_pgsql, $pdo;
    return $is_pgsql ? (int)$pdo->lastInsertId('productos_id_seq') : (int)$pdo->lastInsertId();
}

function limit_1() {
    return 'LIMIT 1';
}
?>
