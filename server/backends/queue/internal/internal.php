<?php

    /**
     * backends queue namespace
     */

    namespace backends\queue
    {
        class internal extends queue
        {
            private $tasks = [
                "minutely" => [
                    "autoconfigureDomophones",
                ]
            ];

            /**
             * @inheritDoc
             */
            function changed($objectType, $objectId)
            {
                $households = loadBackend("households");
                $domophones = [];

                switch ($objectType) {
                    case "domophone":
                        $this->db->insert("insert into tasks_changes (object_type, object_id) values ('domophone', :object_id)", [
                            "object_id" => checkInt($objectId),
                        ], [
                            "silent"
                        ]);
                        return true;

                    case "house":
                    case "entrance":
                    case "flat":
                    case "subscriber":
                        if ($households) {
                            $domophones = $households->getDomophones($objectType, $objectId);
                        }
                        break;
                }

                foreach ($domophones as $domophone) {
                    $this->db->insert("insert into tasks_changes (object_type, object_id) values ('domophone', :object_id)", [
                        "object_id" => checkInt($domophone["domophoneId"]),
                    ], [
                        "silent"
                    ]);
                }

                return true;
            }

            /**
             * @inheritDoc
             */
            function cron($part)
            {
                if (@$this->tasks[$part]) {
                    foreach ($this->tasks[$part] as $task) {
                        $this->$task();
                    }
                    $this->wait();
                    return true;
                } else {
                    return parent::cron($part);
                }
            }

            /**
             * @inheritDoc
             */
            function autoconfigureDomophones()
            {
                global $script_filename;

                $pid = getmypid();

                $domophones = $this->db->get("select task_change_id, house_domophone_id, first_time from tasks_changes left join houses_domophones on tasks_changes.object_id = houses_domophones.house_domophone_id where object_type = 'domophone' limit 25", [], [
                    'task_change_id' => 'taskChangeId',
                    'house_domophone_id' => 'domophoneId',
                    'first_time' => 'firstTime',
                ]);

                foreach ($domophones as $domophone) {
                    $this->db->modify("delete from tasks_changes where task_change_id = ${domophone['taskChangeId']}");
                    if ((int)$domophone['firstTime']) {
                        shell_exec("{PHP_BINARY} {$script_filename} --autoconfigure-domophone={$domophone["domophoneId"]} --first-time --parent-pid=$pid 1>/dev/null 2>&1 &");
                    } else {
                        shell_exec("{PHP_BINARY} {$script_filename} --autoconfigure-domophone={$domophone["domophoneId"]} --parent-pid=$pid 1>/dev/null 2>&1 &");
                    }
                }

                $this->wait();
            }

            /**
             * @inheritDoc
             */
            function wait()
            {
                $pid = getmypid();

                while (true) {
                    $running = @(int)$this->db->get("select count(*) from core_running_processes where (done is null or done = '') and ppid = $pid", [], [], [ "fieldlify" ]);
                    if ($running) {
                        sleep(1);
                    } else {
                        break;
                    }
                }
            }
        }
    }
