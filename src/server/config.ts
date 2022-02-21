import cfg from "config";

const config = {
    db: {
        connectionString: cfg.get<string>("db.connectionString"),
        username: cfg.get<string>("db.username"),
        password: cfg.get<string>("db.password"),
        bucket: cfg.get<string>("db.bucket"),
        scope: cfg.get<string>("db.scope")
    },
    port: cfg.get<number>("port"),
    logLevel: cfg.get<string>("logLevel"),
    pathPrefix: cfg.get<string>("pathPrefix")
};

export default config;
