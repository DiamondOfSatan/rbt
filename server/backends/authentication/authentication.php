<?php

    /**
     * backends authentication namespace
     */

    namespace backends\authentication {

        use backends\backend;
        use MongoDB\Exception\BadMethodCallException;

        /**
         * base authentication class
         */

        abstract class authentication extends backend {

            /**
             * @param string $login login
             * @param string $password plain-text password
             * @return mixed
             */

            abstract public function check_auth($login, $password);

            /**
             * @param string $login login
             * @param string $password plain-text password
             * @param boolean $rememberMe generate persistent (10 year ttl) token
             * @param string $ua user agent
             * @param string $did device id
             * @return array
             */

            public function login($login, $password, $rememberMe, $ua = "", $did = "") {
                $uid = $this->check_auth($login, $password);
                if ($uid !== false) {
                    $keys = $this->redis->keys("auth_*_" . $uid);
                    $first_key = "";
                    $first_key_time = time();
                    if (count($keys) > $this->config["redis"]["max_allowed_tokens"]) {
                        foreach ($keys as $key) {
                            try {
                                $auth = json_decode($this->redis->get($key));
                                if (@(int)$auth["updated"] < $first_key_time) {
                                    $first_key = $key;
                                }
                            } catch (\Exception $e) {
                                $this->redis->delete($key);
                            }
                        }
                        $this->redis->delete($first_key);
                    }
                    if ($rememberMe) {
                        $token = md5($uid . ":" . $login . ":" . $password . ":" . $did);
                    } else {
                        $token = md5(GUIDv4());
                    }
                    $this->redis->setex("auth_" . $token . "_" . $uid, $rememberMe?(7 * 24 * 60 * 60):$this->config["redis"]["token_idle_ttl"], json_encode([
                        "uid" => (string)$uid,
                        "login" => $login,
                        "persistent" => $rememberMe,
                        "ua" => $ua,
                        "did" => $did,
                        "started" => time(),
                        "updated" => time(),
                    ]));
                    return [
                        "result" => true,
                        "token" => $token,
                    ];
                } else {
                    return [
                        "result" => false,
                        "code" => 404,
                        "error" => "userNotFound",
                    ];
                }
            }

            /**
             * @param string $token authentication token
             * @param string $ua user agent
             * @return false|array
             */

            public function auth($token, $ua = "", $ip = "") {
                $keys = $this->redis->keys("auth_" . $token . "_*");

                foreach ($keys as $key) {
                    $auth = json_decode($this->redis->get($key), true);

                    if ($ua) {
                        $auth["ua"] = $ua;
                    }

                    if ($ip) {
                        $auth["ip"] = $ip;
                    }

                    $auth["updated"] = time();

                    $this->redis->setex($key, $auth["persistent"]?(7 * 24 * 60 * 60):$this->config["redis"]["token_idle_ttl"], json_encode($auth));

                    return $auth;
                }

                return false;
            }

            /**
             * @param string $token authentication token
             * @param boolean $all logout only this token or all tokens by uid
             * @return void
             */

            public function logout($token, $all = false) {
                $keys = $this->redis->keys("auth_" . $token . "_*");

                if ($all) {
                    foreach ($keys as $key) {
                        $uid = (string)@explode("_", $key)[2];
                        $_keys = $this->redis->keys("auth_*_" . $uid);

                        foreach ($_keys as $_key) {
                            $this->redis->del($_key);
                        }

                        break;
                    }
                } else {
                    $keys = $this->redis->keys("auth_" . $token . "_*");

                    foreach ($keys as $key) {
                        $this->redis->del($key);
                    }
                }
            }
        }
    }

