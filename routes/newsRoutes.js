const router = require("express-promise-router")();

const { getNews } = require("../controllers/newsController");
const { getRT } = require("../controllers/rtController");
const { getBBC } = require("../controllers/bbcController");

router.get("/:page", getNews);

router.get("/", (req, res) => {
    if(req.query.url.includes('bbc.com'))
        return getBBC(req, res);
        
    if(req.query.url.includes('actualidad.rt.com')) 
        return getRT(req, res);

    res.status(404).send('Noticia no encontrada.');
});

module.exports = router;
