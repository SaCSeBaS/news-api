const NewsApi = require("newsapi");
const newsApi = new NewsApi("d4d3ee5383114b64b136c1ab66c778ee");

const moment = require("moment");

const availableDomains = [
  "rt.com",
  "bbc.com",
  "cnn.com",
  "elpais.com",
  "elconfidencial.com",
  "hipertextual.com",
];

const from = moment().subtract(5, "days").format("YYYY-MM-DD");
const to = moment().format("YYYY-MM-DD");

const fetchNews = (page) => {
  return new Promise((resolve, reject) => {
    newsApi.v2
      .everything({
        q: "coronavirus, covid-19",
        language: "es",
        domains: availableDomains.join(","),
        from: from,
        to: to,
        page: page,
        sortBy: "relevancy",
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

module.exports = {
  getNews: async (req, res, next) => {
    const { page } = req.params;
    const news = await fetchNews(page);
    res.status(200).json(news);
  },
};
