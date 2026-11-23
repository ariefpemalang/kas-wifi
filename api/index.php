<?php
// api/index.php - REST API Endpoint untuk Aplikasi Mobile Kas WiFi
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/functions.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

function json_out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    switch ($action) {
        case 'ping':
            json_out(['status' => 'success', 'message' => 'KAS WIFI API Online', 'time' => date('Y-m-d H:i:s')]);
            break;

        case 'login':
            $username = trim($input['username'] ?? '');
            $password = trim($input['password'] ?? '');

            if (empty($username) || empty($password)) {
                json_out(['status' => 'error', 'message' => 'Username dan password wajib diisi!'], 400);
            }

            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                unset($user['password']);
                json_out(['status' => 'success', 'message' => 'Login berhasil!', 'user' => $user]);
            } else {
                json_out(['status' => 'error', 'message' => 'Username atau password salah!'], 401);
            }
            break;

        case 'summary':
            $wallets_data = get_all_wallets_with_balance($pdo);
            $wallets = array_values($wallets_data['wallets']);
            $total_balance = $wallets_data['total_balance'];

            // Pemasukan & Pengeluaran Hari Ini
            $today = date('Y-m-d');
            $q_in_today = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'pemasukan' AND DATE(transaction_time) = ?");
            $q_in_today->execute([$today]);
            $in_today = (float)$q_in_today->fetchColumn();

            $q_out_today = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'pengeluaran' AND DATE(transaction_time) = ?");
            $q_out_today->execute([$today]);
            $out_today = (float)$q_out_today->fetchColumn();

            // Pemasukan & Pengeluaran Bulan Ini
            $month = date('Y-m');
            $q_in_month = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'pemasukan' AND DATE_FORMAT(transaction_time, '%Y-%m') = ?");
            $q_in_month->execute([$month]);
            $in_month = (float)$q_in_month->fetchColumn();

            $q_out_month = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'pengeluaran' AND DATE_FORMAT(transaction_time, '%Y-%m') = ?");
            $q_out_month->execute([$month]);
            $out_month = (float)$q_out_month->fetchColumn();

            // Transaksi Terbaru
            $stmt_trans = $pdo->query("
                SELECT t.*, w.name AS wallet_name, c.name AS category_name
                FROM transactions t
                JOIN wallets w ON t.wallet_id = w.id
                LEFT JOIN categories c ON t.category_id = c.id
                ORDER BY t.transaction_time DESC, t.id DESC
                LIMIT 15
            ");
            $recent_transactions = $stmt_trans->fetchAll();

            // Transfer Terbaru
            $stmt_tr = $pdo->query("
                SELECT tr.*, wf.name AS from_wallet_name, wt.name AS to_wallet_name
                FROM transfers tr
                JOIN wallets wf ON tr.from_wallet_id = wf.id
                JOIN wallets wt ON tr.to_wallet_id = wt.id
                ORDER BY tr.transfer_time DESC, tr.id DESC
                LIMIT 10
            ");
            $recent_transfers = $stmt_tr->fetchAll();

            // Kategori
            $categories = $pdo->query("SELECT * FROM categories ORDER BY type ASC, name ASC")->fetchAll();

            json_out([
                'status' => 'success',
                'data' => [
                    'wallets' => $wallets,
                    'total_balance' => $total_balance,
                    'today' => [
                        'income' => $in_today,
                        'expense' => $out_today,
                        'net' => $in_today - $out_today
                    ],
                    'month' => [
                        'income' => $in_month,
                        'expense' => $out_month,
                        'net' => $in_month - $out_month
                    ],
                    'categories' => $categories,
                    'recent_transactions' => $recent_transactions,
                    'recent_transfers' => $recent_transfers
                ]
            ]);
            break;

        case 'transactions':
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $type = $_GET['type'] ?? '';
            $wallet_id = !empty($_GET['wallet_id']) ? (int)$_GET['wallet_id'] : 0;
            $start_date = $_GET['start_date'] ?? '';
            $end_date = $_GET['end_date'] ?? '';
            $q = trim($_GET['q'] ?? '');

            $sql = "
                SELECT t.*, w.name AS wallet_name, c.name AS category_name
                FROM transactions t
                JOIN wallets w ON t.wallet_id = w.id
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE 1=1
            ";
            $params = [];

            if (!empty($type)) {
                $sql .= " AND t.type = ?";
                $params[] = $type;
            }
            if ($wallet_id > 0) {
                $sql .= " AND t.wallet_id = ?";
                $params[] = $wallet_id;
            }
            if (!empty($start_date)) {
                $sql .= " AND DATE(t.transaction_time) >= ?";
                $params[] = $start_date;
            }
            if (!empty($end_date)) {
                $sql .= " AND DATE(t.transaction_time) <= ?";
                $params[] = $end_date;
            }
            if (!empty($q)) {
                $sql .= " AND (t.description LIKE ? OR c.name LIKE ?)";
                $params[] = "%$q%";
                $params[] = "%$q%";
            }

            $sql .= " ORDER BY t.transaction_time DESC, t.id DESC LIMIT " . $limit;
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $transactions = $stmt->fetchAll();

            json_out(['status' => 'success', 'data' => $transactions]);
            break;

        case 'create_transaction':
            $type = trim($input['type'] ?? '');
            $wallet_id = (int)($input['wallet_id'] ?? 0);
            $category_id = !empty($input['category_id']) ? (int)$input['category_id'] : null;
            $amount = (float)($input['amount'] ?? 0);
            $datetime = !empty($input['transaction_time']) ? $input['transaction_time'] : date('Y-m-d H:i:s');
            $description = trim($input['description'] ?? '');

            if (!in_array($type, ['pemasukan', 'pengeluaran'])) {
                json_out(['status' => 'error', 'message' => 'Tipe transaksi tidak valid!'], 400);
            }
            if ($wallet_id <= 0) {
                json_out(['status' => 'error', 'message' => 'Pilih wallet valid!'], 400);
            }
            if ($amount <= 0) {
                json_out(['status' => 'error', 'message' => 'Nominal harus lebih dari 0!'], 400);
            }

            $stmt = $pdo->prepare("
                INSERT INTO transactions (type, wallet_id, category_id, amount, description, transaction_time)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$type, $wallet_id, $category_id, $amount, $description, $datetime]);
            $inserted_id = $pdo->lastInsertId();

            json_out([
                'status' => 'success',
                'message' => 'Transaksi berhasil disimpan!',
                'id' => $inserted_id
            ]);
            break;

        case 'delete_transaction':
            $id = (int)($input['id'] ?? $_GET['id'] ?? 0);
            if ($id <= 0) {
                json_out(['status' => 'error', 'message' => 'ID transaksi tidak valid!'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ?");
            $stmt->execute([$id]);

            json_out(['status' => 'success', 'message' => 'Transaksi berhasil dihapus!']);
            break;

        case 'create_transfer':
            $from_id = (int)($input['from_wallet_id'] ?? 0);
            $to_id = (int)($input['to_wallet_id'] ?? 0);
            $amount = (float)($input['amount'] ?? 0);
            $datetime = !empty($input['transfer_time']) ? $input['transfer_time'] : date('Y-m-d H:i:s');
            $description = trim($input['description'] ?? '');

            if ($from_id <= 0 || $to_id <= 0) {
                json_out(['status' => 'error', 'message' => 'Pilih dompet asal dan tujuan!'], 400);
            }
            if ($from_id === $to_id) {
                json_out(['status' => 'error', 'message' => 'Dompet asal dan tujuan tidak boleh sama!'], 400);
            }
            if ($amount <= 0) {
                json_out(['status' => 'error', 'message' => 'Nominal harus lebih dari 0!'], 400);
            }

            // Validasi saldo sumber
            $wallets_data = get_all_wallets_with_balance($pdo);
            $stmt_f = $pdo->prepare("SELECT name FROM wallets WHERE id = ?");
            $stmt_f->execute([$from_id]);
            $f_name = $stmt_f->fetchColumn();

            $from_bal = $wallets_data['wallets'][$f_name]['current_balance'] ?? 0;
            if ($amount > $from_bal) {
                json_out(['status' => 'error', 'message' => "Saldo {$f_name} tidak mencukupi! Saldo saat ini: " . format_rupiah($from_bal)], 400);
            }

            $stmt = $pdo->prepare("
                INSERT INTO transfers (from_wallet_id, to_wallet_id, amount, description, transfer_time)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$from_id, $to_id, $amount, $description, $datetime]);

            json_out(['status' => 'success', 'message' => 'Transfer berhasil disimpan!']);
            break;

        case 'categories':
            $categories = $pdo->query("SELECT * FROM categories ORDER BY type ASC, name ASC")->fetchAll();
            json_out(['status' => 'success', 'data' => $categories]);
            break;

        case 'create_category':
            $name = trim($input['name'] ?? '');
            $type = trim($input['type'] ?? '');

            if (empty($name)) {
                json_out(['status' => 'error', 'message' => 'Nama kategori wajib diisi!'], 400);
            }
            if (!in_array($type, ['pemasukan', 'pengeluaran'])) {
                json_out(['status' => 'error', 'message' => 'Tipe kategori tidak valid!'], 400);
            }

            $stmt = $pdo->prepare("INSERT INTO categories (name, type) VALUES (?, ?)");
            $stmt->execute([$name, $type]);

            json_out(['status' => 'success', 'message' => 'Kategori berhasil ditambahkan!', 'id' => $pdo->lastInsertId()]);
            break;

        case 'delete_category':
            $id = (int)($input['id'] ?? $_GET['id'] ?? 0);
            if ($id <= 0) {
                json_out(['status' => 'error', 'message' => 'ID kategori tidak valid!'], 400);
            }
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            json_out(['status' => 'success', 'message' => 'Kategori berhasil dihapus!']);
            break;

        case 'sync':
            // Batch sinkronisasi transaksi offline dari mobile
            $items = $input['transactions'] ?? [];
            $transfers = $input['transfers'] ?? [];
            $count_saved = 0;

            if (is_array($items)) {
                $stmt = $pdo->prepare("
                    INSERT INTO transactions (type, wallet_id, category_id, amount, description, transaction_time)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                foreach ($items as $item) {
                    $stmt->execute([
                        $item['type'],
                        (int)$item['wallet_id'],
                        !empty($item['category_id']) ? (int)$item['category_id'] : null,
                        (float)$item['amount'],
                        $item['description'] ?? '',
                        $item['transaction_time'] ?? date('Y-m-d H:i:s')
                    ]);
                    $count_saved++;
                }
            }

            if (is_array($transfers)) {
                $stmt_tr = $pdo->prepare("
                    INSERT INTO transfers (from_wallet_id, to_wallet_id, amount, description, transfer_time)
                    VALUES (?, ?, ?, ?, ?)
                ");
                foreach ($transfers as $tr) {
                    $stmt_tr->execute([
                        (int)$tr['from_wallet_id'],
                        (int)$tr['to_wallet_id'],
                        (float)$tr['amount'],
                        $tr['description'] ?? '',
                        $tr['transfer_time'] ?? date('Y-m-d H:i:s')
                    ]);
                    $count_saved++;
                }
            }

            json_out([
                'status' => 'success',
                'message' => "Berhasil menyinkronkan {$count_saved} data transaksi ke database!",
                'count' => $count_saved
            ]);
            break;

        default:
            json_out(['status' => 'error', 'message' => 'Aksi API tidak valid!'], 404);
            break;
    }
} catch (Exception $e) {
    json_out(['status' => 'error', 'message' => $e->getMessage()], 500);
}
