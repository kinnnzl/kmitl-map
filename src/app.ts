import * as http from "http";
import * as Koa from "koa";
import * as Router from "koa-router";
import * as BodyParser from "koa-bodyparser";
import * as Knex from "knex";
import * as Send from "koa-send";

const DbConfig = require("../knexfile");
const ENV = process.env.NODE_ENV || "development";

const Db = () => {
    console.log("DB", 
        "Create connection using this configuration",
        DbConfig[ENV]);
    return Knex(DbConfig[ENV]);
}

export const app = new Koa();
const router = new Router();

router.get("index", "/", (ctx: Koa.Context, next: Router.IMiddleware) => {
    console.log("index");
    ctx.response.body = {
        version: "0.1"
    };
    ctx.response.status = 200;
});

const areaRouter = new Router();
areaRouter
.get("List all areas", "/areas", async (ctx: Koa.Context, next: Router.IMiddleware) => {
    const db = Db();

    const response = await db.table("Area");
    db.destroy();
    ctx.response.body = response;
    ctx.response.status = 200;
})
.get("Get by AreaID", "/areas/:id", async (ctx: Koa.Context, next: Router.IMiddleware) => {
    const db = Db();

    const response = await db.table("Area").where({id: parseInt(ctx.params.id)}).first();
    db.destroy();
    ctx.response.body = response;
    ctx.response.status = 200;
})
.get("Get buildings of area", "/areas/:id/buildings", async (ctx: Koa.Context, next: Router.IMiddleware) => {
    const db = Db();

    const response = await db.table("Building").where({AreaID: parseInt(ctx.params.id)});
    db.destroy();

    response.forEach((e: any) => {
        e.PolygonArea = JSON.parse(e.PolygonArea)
    });
    
    ctx.response.body = response;
    ctx.response.status = 200;
})
.get("Get floor of area", "/areas/:id/buildings/:id/floor", async (ctx: Koa.Context, next: Router.IMiddleware) => {
    const db = Db();

    const response = await db.table("Floor").where({BuildingID: parseInt(ctx.params.id)});
    db.destroy();

    response.forEach((e: any) => {
        e.PolygonArea = JSON.parse(e.PolygonArea)
    });
    
    ctx.response.body = response;
    ctx.response.status = 200;
});

router.use(areaRouter.middleware());

app.use(BodyParser());
app.use(router.middleware());
app.use(async (ctx, next) => {
    if (ctx.path.startsWith("/assets")) {
        await Send(ctx, ctx.path);
    }
    else {
        next();
    }
})

const PORT = parseInt(process.env.PORT) || 5000
app.listen(PORT, () => console.log('Koa app listening on ' + PORT));