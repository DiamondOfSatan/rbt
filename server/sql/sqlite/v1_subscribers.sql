-- mobile subscribers
CREATE TABLE subscribers_mobile
(
    subscriber_mobile_id integer not null primary key autoincrement,
    id text,
    auth_token text,
    push_token text,
    push_token_type integer,                                                                                            -- 0 - fcm, 1 - apple, 2 - huawei
    registered text,                                                                                                    -- "YYYY-MM-DD HH:MM:SS.SSS"
    last_seen text,                                                                                                     -- "YYYY-MM-DD HH:MM:SS.SSS"
    device_type text,
    version text
);
CREATE UNIQUE INDEX subscribers_mobile_id on subscribers_mobile(id);