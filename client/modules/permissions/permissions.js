({
    groupsStartPage: 1,
    usersStartPage: 1,

    rights: false,
    groups: false,
    users: false,
    methods: false,

    init: function () {
        leftSide("fas fa-fw fa-balance-scale-right", i18n("permissions.permissions"), "#permissions");
        moduleLoaded("permissions", this);
    },

    /*
        action functions
     */

    doAddGroupRights: function (gid, api, method, allow, deny) {
        loadingStart();
        POST("authorization", "rights", false, {
            user: false,
            gid: gid,
            api: api,
            method: method,
            allow: allow,
            deny: deny,
        }).
        fail(FAIL).
        always(window.modules["permissions"].render);
    },

    doAddUserRights: function (uid, api, method, allow, deny) {
        loadingStart();
        POST("authorization", "rights", false, {
            user: true,
            uid: uid,
            api: api,
            method: method,
            allow: allow,
            deny: deny,
        }).
        fail(FAIL).
        always(window.modules["permissions"].render);
    },

    /*
        UI functions
     */

    addGroupRights: function () {
        let g = [];
        for (let i in window.modules["permissions"].groups) {
            g.push({
                value: window.modules["permissions"].groups[i].gid,
                text: window.modules["permissions"].groups[i].acronym,
            });
        }
        let a = [];
        a.push({
            value: "",
            text: "-",
        });
        for (let i in window.modules["permissions"].methods) {
            a.push({
                value: i,
                text: (window.lang.methods[i] && window.lang.methods[i]["_title"])?window.lang.methods[i]["_title"]:i,
            });
        }
        cardForm({
            title: i18n("permissions.add"),
            footer: true,
            borderless: true,
            topApply: true,
            fields: [
                {
                    id: "gid",
                    type: "select2",
                    title: i18n("groups.acronym"),
                    options: g,
                },
                {
                    id: "api",
                    type: "select2",
                    title: i18n("permissions.api"),
                    options: a,
                    select: (el, id, prefix) => {
                        let m = [
                            {
                                id: "",
                                text: "-",
                            }
                        ];
                        let api = el.val();
                        if (api) {
                            for (let i in window.modules["permissions"].methods[api]) {
                                m.push({
                                    id: i,
                                    text: (window.lang.methods[api] && window.lang.methods[api][i])?window.lang.methods[api][i]["_title"]:i,
                                })
                            }
                        }
                        $(`#${prefix}method`).html("").select2({
                            data: m,
                            theme: "bootstrap4",
                            language: window.lang["_code"],
                        });
                        $(`#${prefix}action`).html("");
                    }
                },
                {
                    id: "method",
                    type: "select2",
                    title: i18n("permissions.method"),
                    options: [
                        {
                            value: "",
                            text: "-",
                        }
                    ],
                    select: (el, id, prefix) => {
                        let a = [];
                        let d = [];
                        let api = $(`#${prefix}api`).val();
                        let method = el.val();
                        if (api && method) {
                            for (let i in window.modules["permissions"].methods[api][method]) {
                                a.push({
                                    id: window.modules["permissions"].methods[api][method][i],
                                    text: (window.lang.methods[api] && window.lang.methods[api][method] && window.lang.methods[api][method][i])?window.lang.methods[api][method][i]:i,
                                    selected: true,
                                });
                                d.push({
                                    id: window.modules["permissions"].methods[api][method][i],
                                    text: (window.lang.methods[api] && window.lang.methods[api][method] && window.lang.methods[api][method][i])?window.lang.methods[api][method][i]:i,
                                });
                            }
                        }
                        $(`#${prefix}actionAllow`).html("").select2({
                            data: a,
                            theme: "bootstrap4",
                            language: window.lang["_code"],
                        });
                        $(`#${prefix}actionDeny`).html("").select2({
                            data: d,
                            theme: "bootstrap4",
                            language: window.lang["_code"],
                        });
                    }
                },
                {
                    id: "actionAllow",
                    type: "select2",
                    title: i18n("permissions.allowYes"),
                    minimumResultsForSearch: Infinity,
                    multiple: true,
                    select: (el, id, prefix) => {
                        let aa = $(`#${prefix}actionAllow`).val();
                        let ad = $(`#${prefix}actionDeny`).val();
                        $(`#${prefix}actionDeny`).val(ad.filter(n => !aa.includes(n))).trigger("change");
                    },
                },
                {
                    id: "actionDeny",
                    type: "select2",
                    title: i18n("permissions.allowNo"),
                    minimumResultsForSearch: Infinity,
                    multiple: true,
                    select: (el, id, prefix) => {
                        let aa = $(`#${prefix}actionAllow`).val();
                        let ad = $(`#${prefix}actionDeny`).val();
                        $(`#${prefix}actionAllow`).val(aa.filter(n => !ad.includes(n))).trigger("change");
                    },
                },
            ],
            callback: function (result) {
                window.modules["permissions"].doAddGroupRights(result.gid, result.api, result.method, result.actionAllow, result.actionDeny);
            },
        }).show();
    },

    addUserRights: function () {
        let u = [];
        for (let i in window.modules["permissions"].users) {
            u.push({
                value: window.modules["permissions"].users[i].uid,
                text: window.modules["permissions"].users[i].login,
            });
        }
        let a = [];
        a.push({
            value: "",
            text: "-",
        });
        for (let i in window.modules["permissions"].methods) {
            a.push({
                value: i,
                text: (window.lang.methods[i] && window.lang.methods[i]["_title"])?window.lang.methods[i]["_title"]:i,
            });
        }
        cardForm({
            title: i18n("permissions.add"),
            footer: true,
            borderless: true,
            topApply: true,
            fields: [
                {
                    id: "uid",
                    type: "select2",
                    title: i18n("users.login"),
                    options: u,
                },
                {
                    id: "api",
                    type: "select2",
                    title: i18n("permissions.api"),
                    options: a,
                    select: (el, id, prefix) => {
                        let m = [
                            {
                                id: "",
                                text: "-",
                            }
                        ];
                        let api = el.val();
                        if (api) {
                            for (let i in window.modules["permissions"].methods[api]) {
                                m.push({
                                    id: i,
                                    text: (window.lang.methods[api] && window.lang.methods[api][i])?window.lang.methods[api][i]["_title"]:i,
                                })
                            }
                        }
                        $(`#${prefix}method`).html("").select2({
                            data: m,
                            theme: "bootstrap4",
                            language: window.lang["_code"],
                        });
                        $(`#${prefix}action`).html("");
                    }
                },
                {
                    id: "method",
                    type: "select2",
                    title: i18n("permissions.method"),
                    options: [
                        {
                            value: "",
                            text: "-",
                        }
                    ],
                    select: (el, id, prefix) => {
                        let a = [];
                        let d = [];
                        let api = $(`#${prefix}api`).val();
                        let method = el.val();
                        if (api && method) {
                            for (let i in window.modules["permissions"].methods[api][method]) {
                                a.push({
                                    id: window.modules["permissions"].methods[api][method][i],
                                    text: (window.lang.methods[api] && window.lang.methods[api][method] && window.lang.methods[api][method][i])?window.lang.methods[api][method][i]:i,
                                    selected: true,
                                });
                                d.push({
                                    id: window.modules["permissions"].methods[api][method][i],
                                    text: (window.lang.methods[api] && window.lang.methods[api][method] && window.lang.methods[api][method][i])?window.lang.methods[api][method][i]:i,
                                });
                            }
                        }
                        $(`#${prefix}actionAllow`).html("").select2({
                            data: a,
                            theme: "bootstrap4",
                            language: window.lang["_code"],
                        });
                        $(`#${prefix}actionDeny`).html("").select2({
                            data: d,
                            theme: "bootstrap4",
                            language: window.lang["_code"],
                        });
                    }
                },
                {
                    id: "actionAllow",
                    type: "select2",
                    title: i18n("permissions.allowYes"),
                    minimumResultsForSearch: Infinity,
                    multiple: true,
                    select: (el, id, prefix) => {
                        let aa = $(`#${prefix}actionAllow`).val();
                        let ad = $(`#${prefix}actionDeny`).val();
                        $(`#${prefix}actionDeny`).val(ad.filter(n => !aa.includes(n))).trigger("change");
                    },
                },
                {
                    id: "actionDeny",
                    type: "select2",
                    title: i18n("permissions.allowNo"),
                    minimumResultsForSearch: Infinity,
                    multiple: true,
                    select: (el, id, prefix) => {
                        let aa = $(`#${prefix}actionAllow`).val();
                        let ad = $(`#${prefix}actionDeny`).val();
                        $(`#${prefix}actionAllow`).val(aa.filter(n => !ad.includes(n))).trigger("change");
                    },
                },
            ],
            callback: function (result) {
                window.modules["permissions"].doAddUserRights(result.uid, result.api, result.method, result.actionAllow, result.actionDeny);
            },
        }).show();
    },

    /*
        main form (permissions) render function
     */

    render: function () {
        loadingStart();
        GET("authorization", "rights", false, true).done(r => {
            window.modules["permissions"].rights = r.rights;

            QUERY("authorization", "methods", {
                all: 0,
            }).done(_m => {
                let m = {};

                for (let i in _m.methods) {
                    for (let j in _m.methods[i]) {
                        for (let k in _m.methods[i][j]) {
                            m[_m.methods[i][j][k]] = {
                                api: i,
                                api_text: (window.lang.methods[i] && window.lang.methods[i]._title)?window.lang.methods[i]._title:i,
                                method: j,
                                method_text: (window.lang.methods[i] && window.lang.methods[i][j] && window.lang.methods[i][j]._title)?window.lang.methods[i][j]._title:j,
                                action: k,
                                action_text: (window.lang.methods[i] && window.lang.methods[i][j] && window.lang.methods[i][j][k])?window.lang.methods[i][j][k]:k,
                            };
                        }
                    }
                }

                window.modules["permissions"].methods = _m.methods;

                GET("accounts", "groups").done(_g => {
                    window.modules["permissions"].groups = _g.groups;

                    let g = {};

                    for (let i in _g.groups) {
                        g[_g.groups[i].gid] = _g.groups[i];
                    }

                    cardTable({
                        target: "#mainForm",
                        title: {
                            button: {
                                caption: i18n("permissions.addRights"),
                                click: window.modules["permissions"].addGroupRights,
                            },
                            caption: i18n("permissions.groups"),
                            filter: true,
                        },
                        startPage: window.modules["permissions"].groupsStartPage,
                        pageChange: page => {
                            window.modules["permissions"].groupsStartPage = page;
                        },
                        columns: [
                            {
                                title: i18n("groups.acronym"),
                                nowrap: true,
                            },
                            {
                                title: i18n("permissions.api"),
                                nowrap: true,
                            },
                            {
                                title: i18n("permissions.method"),
                                nowrap: true,
                                fullWidth: true,
                            },
                            {
                                title: i18n("permissions.mode"),
                                nowrap: true,
                            },
                        ],
                        rows: () => {
                            let rows = [];

                            let x = {};
                            for (let i in window.modules["permissions"].rights.groups) {
                                let t = window.modules["permissions"].rights.groups[i];
                                if (!x[t.gid]) {
                                    x[t.gid] = {};
                                }
                                if (!x[t.gid][m[t.aid].api]) {
                                    x[t.gid][m[t.aid].api] = {
                                        _aid: t.aid,
                                    };
                                }
                                if (!x[t.gid][m[t.aid].api][m[t.aid].method]) {
                                    x[t.gid][m[t.aid].api][m[t.aid].method] = {
                                        _aid: t.aid,
                                    };
                                }
                                x[t.gid][m[t.aid].api][m[t.aid].method][m[t.aid].action] = {
                                    _aid: t.aid,
                                    allow: t.allow,
                                }
                            }

                            for (let i in x) {
                                if (i == "_aid") continue;
                                for (let j in x[i]) {
                                    if (j == "_aid") continue;
                                    for (let k in x[i][j]) {
                                        if (k == "_aid") continue;
                                        let d = "";
                                        if (x[i][j][k]["POST"]) {
                                            if (x[i][j][k]["POST"].allow) {
                                                d += "<span class='text-success'>C</span>";
                                            } else {
                                                d += "<span class='text-danger'>C</span>";
                                            }
                                        } else {
                                            d += "<span>-</span>";
                                        }
                                        if (x[i][j][k]["GET"]) {
                                            if (x[i][j][k]["GET"].allow) {
                                                d += "<span class='text-success'>R</span>";
                                            } else {
                                                d += "<span class='text-danger'>R</span>";
                                            }
                                        } else {
                                            d += "<span>-</span>";
                                        }
                                        if (x[i][j][k]["PUT"]) {
                                            if (x[i][j][k]["PUT"].allow) {
                                                d += "<span class='text-success'>U</span>";
                                            } else {
                                                d += "<span class='text-danger'>U</span>";
                                            }
                                        } else {
                                            d += "<span>-</span>";
                                        }
                                        if (x[i][j][k]["DELETE"]) {
                                            if (x[i][j][k]["DELETE"].allow) {
                                                d += "<span class='text-success'>D</span>";
                                            } else {
                                                d += "<span class='text-danger'>D</span>";
                                            }
                                        } else {
                                            d += "<span>-</span>";
                                        }
                                        rows.push({
                                            uid: i.toString() + '-' + j + '-' + k,
                                            cols: [
                                                {
                                                    data: g[i].acronym,
                                                },
                                                {
                                                    data: m[x[i][j]._aid].api_text,
                                                },
                                                {
                                                    data: m[x[i][j][k]._aid].method_text,
                                                },
                                                {
                                                    data: "<span class='text-monospace text-bold'>" + d + "</span>",
                                                    click: uid => {
                                                        console.log(uid);
                                                    }
                                                },
                                            ],
                                        });
                                    }

                                }
                            }

                            return rows;
                        },
                    });

                    GET("accounts", "users").done(_u => {
                        window.modules["permissions"].users = _u.users;

                        let u = {};

                        for (let i in _u.users) {
                            u[_u.users[i].uid] = _u.users[i];
                        }

                        let x = {};
                        for (let i in window.modules["permissions"].rights.users) {
                            let t = window.modules["permissions"].rights.users[i];
                            if (!x[t.uid]) {
                                x[t.uid] = {};
                            }
                            if (!x[t.uid][m[t.aid].api]) {
                                x[t.uid][m[t.aid].api] = {
                                    _aid: t.aid,
                                };
                            }
                            if (!x[t.uid][m[t.aid].api][m[t.aid].method]) {
                                x[t.uid][m[t.aid].api][m[t.aid].method] = {
                                    _aid: t.aid,
                                };
                            }
                            x[t.uid][m[t.aid].api][m[t.aid].method][m[t.aid].action] = {
                                _aid: t.aid,
                                allow: t.allow,
                            }
                        }

                        cardTable({
                            target: "#altForm",
                            title: {
                                button: {
                                    caption: i18n("permissions.addRights"),
                                    click: window.modules["permissions"].addUserRights,
                                },
                                caption: i18n("permissions.users"),
                                filter: true,
                            },
                            startPage: window.modules["permissions"].usersStartPage,
                            pageChange: page => {
                                window.modules["permissions"].usersStartPage = page;
                            },
                            columns: [
                                {
                                    title: i18n("users.login"),
                                    nowrap: true,
                                },
                                {
                                    title: i18n("permissions.api"),
                                    nowrap: true,
                                },
                                {
                                    title: i18n("permissions.method"),
                                    nowrap: true,
                                    fullWidth: true,
                                },
                                {
                                    title: i18n("permissions.mode"),
                                    nowrap: true,
                                },
                            ],
                            rows: () => {
                                let rows = [];

                                for (let i in x) {
                                    if (i == "_aid") continue;
                                    for (let j in x[i]) {
                                        if (j == "_aid") continue;
                                        for (let k in x[i][j]) {
                                            if (k == "_aid") continue;
                                            let d = "";
                                            if (x[i][j][k]["POST"]) {
                                                if (x[i][j][k]["POST"].allow) {
                                                    d += "<span class='text-success'>C</span>";
                                                } else {
                                                    d += "<span class='text-danger'>C</span>";
                                                }
                                            } else {
                                                d += "<span>-</span>";
                                            }
                                            if (x[i][j][k]["GET"]) {
                                                if (x[i][j][k]["GET"].allow) {
                                                    d += "<span class='text-success'>R</span>";
                                                } else {
                                                    d += "<span class='text-danger'>R</span>";
                                                }
                                            } else {
                                                d += "<span>-</span>";
                                            }
                                            if (x[i][j][k]["PUT"]) {
                                                if (x[i][j][k]["PUT"].allow) {
                                                    d += "<span class='text-success'>U</span>";
                                                } else {
                                                    d += "<span class='text-danger'>U</span>";
                                                }
                                            } else {
                                                d += "<span>-</span>";
                                            }
                                            if (x[i][j][k]["DELETE"]) {
                                                if (x[i][j][k]["DELETE"].allow) {
                                                    d += "<span class='text-success'>D</span>";
                                                } else {
                                                    d += "<span class='text-danger'>D</span>";
                                                }
                                            } else {
                                                d += "<span>-</span>";
                                            }
                                            rows.push({
                                                uid: i.toString() + '-' + j + '-' + k,
                                                cols: [
                                                    {
                                                        data: u[i].login,
                                                    },
                                                    {
                                                        data: m[x[i][j]._aid].api_text,
                                                    },
                                                    {
                                                        data: m[x[i][j][k]._aid].method_text,
                                                    },
                                                    {
                                                        data: "<span class='text-monospace text-bold'>" + d + "</span>",
                                                        click: uid => {
                                                            console.log(uid);
                                                        }
                                                    },
                                                ],
                                            });
                                        }

                                    }
                                }

                                return rows;
                            },
                        }).show();
                        loadingDone();
                    }).
                    fail(FAIL).
                    fail(loadingDone);
                }).
                fail(FAIL).
                fail(loadingDone);
            }).
            fail(FAIL).
            fail(loadingDone);
        }).
        fail(FAIL).
        fail(loadingDone);
    },

    route: function (params) {
        document.title = i18n("windowTitle") + " :: " + i18n("permissions.permissions");

        window.modules["permissions"].render();
    }
}).init();