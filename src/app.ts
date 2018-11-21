import * as http from "http";
import * as Koa from "koa";
import * as Router from "koa-router";
import * as BodyParser from "koa-bodyparser";
import * as Knex from "knex";
import * as Send from "koa-send";

const DbConfig = require("../knexfile");
const ENV = process.env.NODE_ENV || "development";

const Db = () => {
    return Knex(DbConfig[ENV]);
}

export const app = new Koa();
const router = new Router();

router.get("index", "/", (ctx, next) => {
    console.log("index");
    ctx.response.body = {
        version: "0.1"
    };
    ctx.response.status = 200;
    next();
});

const areaRouter = new Router();
areaRouter
.get("List all areas", "/areas", async (ctx, next) => {
    const db = Db();

    const response = await db.table("Area");
    db.destroy();

    ctx.response.body = response;
    ctx.response.status = 200;
    next();
})
.get("Get by AreaID", "/areas/:id", async (ctx, next) => {
    const db = Db();

    const response = await db.table("Area").where({id: parseInt(ctx.params.id)}).first();
    db.destroy();
    ctx.response.body = response;
    ctx.response.status = 200;
    next();
})
.get("Get by FloorID", "/floors/:id", async (ctx, next) => {
    const db = Db();

    const response = await db.table("Floor").where({id: parseInt(ctx.params.id)}).first();
    db.destroy();
    ctx.response.body = response;
    ctx.response.status = 200;
    next();
})
.get("Get buildings of area", "/areas/:id/buildings", async (ctx, next) => {
    const db = Db();

    const response = await db.table("Building").where({AreaID: parseInt(ctx.params.id)});
    db.destroy();

    response.forEach((e: any) => {
        e.PolygonArea = JSON.parse(e.PolygonArea)
    });
    
    ctx.response.body = response;
    ctx.response.status = 200;
    next();
})
.get("Get floor of area", "/areas/:areaID/buildings/:buildingID/floors", async (ctx, next) => {
    const db = Db();
    const building = await db.table("Building").where({AreaID: parseInt(ctx.params.areaID)}).first();

    if(!building) {
        ctx.response.status = 404;
        ctx.response.body = {
            error: "Resource not found."
        };
        next();
    }

    const floors = await db.table("Floor").where({BuildingID: parseInt(ctx.params.buildingID)});
    db.destroy();

    floors.forEach((e: any) => {
        e.PolygonArea = JSON.parse(e.PolygonArea)
    })
    
    
    ctx.response.body = floors;
    ctx.response.status = 200;
    next();
})

.get("Get room of area", "/areas/:id/buildings/:buildingID/floors/:floorID/rooms", async (ctx, next) => {
    const db = Db();
    
    const building = await db.table("Building").where({AreaID: parseInt(ctx.params.areaID)}).first();
    if(!building) {
        ctx.response.status = 404;
        ctx.response.body = {
            error: "Resource not found."
        };
        next();
    }
    const floor =  await db.table("Floor").where({BuildingID: parseInt(ctx.params.buildingID)});
    const room = await db.table("Room").where({FloorID: parseInt(ctx.params.floorID)});
    db.destroy();

    room.forEach((e: any) => {
        e.PolygonArea = JSON.parse(e.PolygonArea)
    })
    
    
    ctx.response.body = room;
    ctx.response.status = 200;
    next();
});

app.use(async (ctx, next) => {
    await next();
    console.log(`${Date.now()}:${ctx.request.url} - ${ctx.response.status}`);
});
router.use(areaRouter.middleware());
app.use(async (ctx, next) => {
    if (ctx.path.startsWith("/assets")) {
        await Send(ctx, ctx.path);
    }
    await next();
});
app.use(BodyParser());
app.use(router.middleware());

const PORT = parseInt(process.env.PORT) || 5000
app.listen(PORT, () => console.log('Koa app listening on ' + PORT));
