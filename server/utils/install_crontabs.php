<?php

    function installCrontabs() {
        $crontab = [];
        exec("crontab -l", $crontab);

        $clean = [];
        $skip = false;

        $cli = PHP_BINARY . " " . __DIR__ . "/../cli.php --cron";

        $lines = 0;

        foreach ($crontab as $line) {
            if ($line === "## RBT crons start, dont't touch!!!") {
                $skip = true;
            }
            if (!$skip) {
                $clean[] = $line;
            }
            if ($line === "## RBT crons end, dont't touch!!!") {
                $skip = false;
            }
        }

        $clean = explode("\n", trim(implode("\n", $clean)));

        $clean[] = "";

        $clean[] = "## RBT crons start, dont't touch!!!";
        $lines++;
        $clean[] = "*/1 * * * * $cli=minutely";
        $lines++;
        $clean[] = "2 */1 * * * $cli=hourly";
        $lines++;
        $clean[] = "3 1 */1 * * $cli=daily";
        $lines++;
        $clean[] = "4 1 1 */1 * $cli=monthly";
        $lines++;
        $clean[] = "## RBT crons end, dont't touch!!!";
        $lines++;

        file_put_contents(sys_get_temp_dir() . "/rbt_crontab", trim(implode("\n", $clean)));

        system("crontab " . sys_get_temp_dir() . "/rbt_crontab");

        return $lines;
    }

    function unInstallCrontabs() {
        $crontab = [];
        exec("crontab -l", $crontab);

        $clean = [];
        $skip = false;

        $lines = 0;

        foreach ($crontab as $line) {
            if ($line === "## RBT crons start, dont't touch!!!") {
                $skip = true;
            }
            if (!$skip) {
                $clean[] = $line;
            } else {
                $lines++;
            }
            if ($line === "## RBT crons end, dont't touch!!!") {
                $skip = false;
            }
        }

        $clean = explode("\n", trim(implode("\n", $clean)));

        file_put_contents(sys_get_temp_dir() . "/rbt_crontab", trim(implode("\n", $clean)));

        system("crontab " . sys_get_temp_dir() . "/rbt_crontab");

        return $lines;
    }

