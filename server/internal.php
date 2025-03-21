<?php
    mb_internal_encoding("UTF-8");

    require_once "backends/backend.php";
    require_once "utils/loader.php";
    require_once "utils/db_ext.php";
    require_once "utils/error.php";
    require_once "utils/i18n.php";

    $config = false;

    try {
        $config = @json_decode(file_get_contents(__DIR__ . "/config/config.json"), true);
    } catch (Exception $e) {
        error_log(print_r($e, true));
        response(555, [
            "error" => "config",
        ]);
    }

    if (!$config) {
        response(555, [
            "error" => "noConfig",
        ]);
    }

    $backends = [];
    $redis_cache_ttl = $config["redis"]["cache_ttl"] ? : 3600;

    try {
        $redis = new Redis();
        $redis->connect($config["redis"]["host"], $config["redis"]["port"]);
        if (@$config["redis"]["password"]) {
            $redis->auth($config["redis"]["password"]);
        }
        $redis->setex("iAmOk", 1, "1");
    } catch (Exception $e) {
        error_log(print_r($e, true));
        response(555, [
            "error" => "redis",
        ]);
    }

    try {
        $db = new PDO_EXT(@$config["db"]["dsn"], @$config["db"]["username"], @$config["db"]["password"], @$config["db"]["options"]);
    } catch (Exception $e) {
        error_log(print_r($e, true));
        response(555, [
            "error" => "PDO",
        ]);
    }

    class Access
    {
        private static array $allowedHosts = ["127.0.0.1", "192.168.15.81", "172.28.0.1"];

        public static function getIp()
        {
            if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
                $ip_address = $_SERVER['HTTP_CLIENT_IP'];
            }
            //ip is from proxy
            elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
                $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'];
            }
            //ip is from remote address
            else {
                $ip_address = $_SERVER['REMOTE_ADDR'];
            }

            return $ip_address;
        }

        public static function check(): void
        {
            $ip = self::getIp();
            $hosts = self::$allowedHosts;
            $access = !in_array($ip, $hosts);

            if ($access) {
                response(403, null,"Access denied","Access denied for this host: $ip");
//                Response::res(403, "Forbidden", "Access denied for this host: ". $ip);
                exit();
            }
        }
    }

    function response($code = 204, $data = false, $name = false, $message = false) {
    global $response_data_source, $response_cahce_req, $response_cache_ttl;
    $response_codes = [
        200 => [ 'name' => 'OK', 'message' => 'Хорошо' ],
        201 => [ 'name' => 'Created', 'message' => 'Создано' ],
        202 => [ 'name' => 'Accepted', 'message' => 'Принято' ],
        203 => [ 'name' => 'Non-Authoritative Information', 'message' => 'Информация не авторитетна' ],
        204 => [ 'name' => 'No Content', 'message' => 'Нет содержимого' ],
        205 => [ 'name' => 'Reset Content', 'message' => 'Сбросить содержимое' ],
        206 => [ 'name' => 'Partial Content', 'message' => 'Частичное содержимое' ],
        207 => [ 'name' => 'Multi-Status', 'message' => 'Многостатусный' ],
        208 => [ 'name' => 'Already Reported', 'message' => 'Уже сообщалось' ],
        226 => [ 'name' => 'IM Used', 'message' => 'Использовано IM' ],
        400 => [ 'name' => 'Bad Request', 'message' => 'Плохой, неверный запрос' ],
        401 => [ 'name' => 'Unauthorized', 'message' => 'Не авторизован' ],
        402 => [ 'name' => 'Payment Required', 'message' => 'Необходима оплата' ],
        403 => [ 'name' => 'Forbidden', 'message' => 'Запрещено' ],
        404 => [ 'name' => 'Not Found', 'message' => 'Не найдено' ],
        405 => [ 'name' => 'Method Not Allowed', 'message' => 'Метод не поддерживается' ],
        406 => [ 'name' => 'Not Acceptable', 'message' => 'Неприемлемо' ],
        407 => [ 'name' => 'Proxy Authentication Required', 'message' => 'Необходима аутентификация прокси' ],
        408 => [ 'name' => 'Request Timeout', 'message' => 'Истекло время ожидания' ],
        409 => [ 'name' => 'Conflict', 'message' => 'Конфликт' ],
        410 => [ 'name' => 'Gone', 'message' => 'Удалён' ],
        411 => [ 'name' => 'Length Required', 'message' => 'Необходима длина' ],
        412 => [ 'name' => 'Precondition Failed', 'message' => 'Условие ложно' ],
        413 => [ 'name' => 'Payload Too Large', 'message' => 'Полезная нагрузка слишком велика' ],
        414 => [ 'name' => 'URI Too Long', 'message' => 'URI слишком длинный' ],
        415 => [ 'name' => 'Unsupported Media Type', 'message' => 'Неподдерживаемый тип данных' ],
        416 => [ 'name' => 'Range Not Satisfiable', 'message' => 'Диапазон не достижим' ],
        417 => [ 'name' => 'Expectation Failed', 'message' => 'Ожидание не удалось' ],
        418 => [ 'name' => 'I’m a teapot', 'message' => 'Я — чайник' ],
        419 => [ 'name' => 'Authentication Timeout (not in RFC 2616)', 'message' => 'Обычно ошибка проверки CSRF' ],
        421 => [ 'name' => 'Misdirected Request', 'message' => 'Запрос направлен неверно' ],
        422 => [ 'name' => 'Unprocessable Entity', 'message' => 'Необрабатываемый экземпляр' ],
        423 => [ 'name' => 'Locked', 'message' => 'Заблокировано' ],
        424 => [ 'name' => 'Failed Dependency', 'message' => 'Невыполненная зависимость' ],
        426 => [ 'name' => 'Upgrade Required', 'message' => 'Необходимо обновление' ],
        428 => [ 'name' => 'Precondition Required', 'message' => 'Необходимо предусловие' ],
        429 => [ 'name' => 'Too Many Requests', 'message' => 'Слишком много запросов' ],
        431 => [ 'name' => 'Request Header Fields Too Large', 'message' => 'Поля заголовка запроса слишком большие' ],
        449 => [ 'name' => 'Retry With', 'message' => 'Повторить с' ],
        451 => [ 'name' => 'Unavailable For Legal Reasons', 'message' => 'Недоступно по юридическим причинам' ],
        499 => [ 'name' => 'Client Closed Request', 'message' => 'Клиент закрыл соединение' ],
        503 => [ 'name' => 'Service Unavailable', 'message' => 'Сервис недоступен' ],
    ];
    header('Content-Type: application/json');
    http_response_code($code);
    if ((int)$code < 300 && $response_cahce_req && $response_data_source == 'db' && (int)$response_cache_ttl > 0) {
//        $redis->setEx($response_cahce_req, $response_cache_ttl, json_encode([
//            'code' => $code,
//            'data' => $data,
//        ], JSON_UNESCAPED_UNICODE));
    }
    if ((int)$code == 204) {
        exit;
    }
    $ret = [
        'code' => $code,
    ];
    if (!$message) {
        if ($name) {
            $message = $name;
        } else {
            $message = @$response_codes[$code]['message'];
        }
    }
    if (!$name) {
        $name = @$response_codes[$code]['name'];
    }
    if ($name) {
        $ret['name'] = $name;
    }
    if ($message) {
        $ret['message'] = $message;
    }
    if ($data) {
        $ret['data'] = $data;
    }
    echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    exit;
}

    /**Test wrapper for FRS API request
     * @param {string} url
     * @param {object} payload
     */
    function apiExec ($url, $payload){
        $curl = curl_init();
        $data = json_encode($payload);
        $options = [
            CURLOPT_URL => $url,
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS=> $data,
            CURLOPT_RETURNTRANSFER => 1,
            CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/json']
        ];
        curl_setopt_array($curl,$options);
        $response = curl_exec($curl);
        curl_close($curl);
        return $response;
    }

    Access::check();

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $raw_postdata = file_get_contents("php://input");
        $postdata = json_decode($raw_postdata, true);

        if (!isset($postdata)) {
            response(405, ["error"=>"post body"]);
        }

        $path = explode("?", $_SERVER["REQUEST_URI"])[0];

        $server = parse_url($config["api"]["internal"]);

        if ($server && $server['path']) {
            $path = substr($path, strlen($server['path']));
        }

        if ($path && $path[0] == '/') {
            $path = substr($path, 1);
        }

        $m = explode('/', $path);

        array_unshift($m, "internal");
        array_unshift($m, false);

        if (count($m) == 4 && !$m[0] && $m[1] == 'internal') {
            $module = $m[2];
            $method = $m[3];
            if (file_exists(__DIR__ . "/internal/{$module}/{$method}.php")) {
                require_once __DIR__ . "/internal/{$module}/{$method}.php";
            }
        }

        response(405);
    }

    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $m = explode('/', $_SERVER["REQUEST_URI"]);
        if (count($m) == 5 && !$m[0] && $m[1] == 'internal') {
            $module = $m[2];
            $method = $m[3];
            $param = $m[4];
            require_once __DIR__ . "/internal/{$module}/{$method}.php";
        }

    }

    response(404);