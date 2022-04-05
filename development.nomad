job "sports-scores-dev" {
    type = "service"
    datacenters = ["ystv-dc0"]

    group "web" {
        count = 1
        constraint {
            attribute = "${attr.unique.hostname}"
            value = "moss.ystv.york.ac.uk"
        }

        network {
            port "api" {
                static = 5001
                to = 8000
            }
            port "ui" {
                static = 5002
                to = 80
            }
            port "redis" {
                static = 6379
                to = 6379
            }
        }

        task "redis" {
            driver = "docker"
            config {
                image = "docker.io/library/redis:alpine"
                ports = ["redis"]
            }
            lifecycle {
                hook = "prestart"
                sidecar = true
            }
        }

        task "api" {
            driver = "docker"
            config {
                image = "registry.comp.ystv.co.uk/sports-scores/server:latest"
                ports = ["api"]
            }
            env {
                DB_CONNECTION_STRING = "couchbase://byte0.ystv.york.ac.uk,byte1.ystv.york.ac.uk,byte2.ystv.york.ac.uk"
                DB_USERNAME = "sports-scores-dev"
                DB_PASSWORD = "devpassword"
                DB_BUCKET = "sports-scores-dev"
                DB_SCOPE = "_default"
                PORT = "8000"
                PATH_PREFIX = "/api"
                REDIS_CONNECTION_STRING = "redis://moss.ystv.york.ac.uk:6379"
                LOG_LEVEL = "trace"
            }
        }

        task "ui" {
            driver = "docker"
            config {
                image = "registry.comp.ystv.co.uk/sports-scores/client:latest"
                ports = ["ui"]
            }
        }
    }
}