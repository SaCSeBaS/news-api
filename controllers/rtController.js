const fetch = require('node-fetch');
const cheerio  = require('cheerio');

const rtScraper = async (url) => {

    // OBTENER HTML
    const res = await fetch(url);
    const data = await res.text();
    // CARGAR HTML A CHEERIO
    const $ = cheerio.load(data);
    // OBTENER EL TÍTULO DE LA PUBLICACIÓN
    let title = $('.ArticleView-title').text().replace(/(\r\n|\n|\r)/gm,"").trim();
    // OBTENER FECHA DE PUBLICACIÓN
    let publishDate = $('.ArticleView-timestamp').text().replace(/(\r\n|\n|\r)/gm,"")
                                                    .replace('Publicado:', "").trim();
    // OBTENER SUMMARY DE PUBLICACIÓN
    let summary = $('.ArticleView-summary').text().replace(/(\r\n|\n|\r)/gm,"").trim();
    // OBTENER MATERIAL MULTIMEDIA
    let coverMultimedia = $('.Cover-root').find('noscript');
    let coverType;

    if($(coverMultimedia).text() != '') {
        coverMultimedia = $(coverMultimedia).text()
            .match(/\bhttps?:\/\/\S+/gi).toString().slice(0, -1);
        coverType = 'image';
    }
    else {
        coverMultimedia = $('.YouTubeEmbed-cover').attr('data-youtubesrc').substring(2);
        coverType = 'video';
    }

    // OBTENER DESCRIPCIÓN DE MULTIMEDIA
    let coverDescription = $('.Cover-footer').find('.Cover-caption').text();
    // OBTENER FUENTE DEL MULTIMEDIA
    let coverSource = $('.Cover-footer').find('.Cover-source').text();
    // OBTENER CONTENIDO DE LA PUBLICACIÓN
    let paragraphs = [];
    let attachment = {};

    $('.Text-root').children().each((i, e) => {
        if((e.tagName == 'p' || e.tagName == 'h3') && $(e).text() != '') {
            // AGREGAR TAG DE HTML
            let attach;
            if(e.tagName == 'p')
                attach = ['<p>','</p>'];
            else
                attach = ['<h3>','</h3>'];
            // OBTENER ATTACHMENT IMAGEN
            const linkImage = $(e).next('.RTImage-root').find('noscript');
            if(linkImage.text() != '') {
                // COLOCAR EL TIPO DE ATTACHMENT CON SU LINK
                attachment.type = 'image';
                attachment.path = linkImage.text().match(/\bhttps?:\/\/\S+/gi).toString().slice(0, -1);
                // COLOCAR DESCRIPCION Y AUTOR DEL ATTACHMENT
                const imageData = $(e).next('.RTImage-root').find('.RTImage-footer');
                if($(imageData).text() != '') {
                    attachment.description = $(imageData).find('.RTImage-caption').text();
                    attachment.author = $(imageData).find('.RTImage-source').text();
                }
                else {
                    attachment.description = '';
                    attachment.author = '';
                }
            }
            else {
                const video = $(e).next('.EmbedBlock-youtube').find('.YouTubeEmbed-cover')
                                            .attr('data-youtubesrc');
                if(video != undefined) {
                    attachment.type = 'video';
                    attachment.path = video.substring(2);
                    attachment.description = '';
                    attachment.author = '';
                }
                else {
                    const twitter = $(e).next('.EmbedBlock-twitter').find('blockquote').find('a');
                    if(twitter.length != 0) {
                        const tweet = $(twitter[twitter.length - 1]).attr('href').split('?');
                        attachment.type = 'twitter';
                        attachment.path = tweet[0];
                        attachment.description = '';
                        attachment.author = tweet[0].split('/')[3].replace('_', ' ');
                    }
                }
            }
            paragraphs.push({ paragraph: attach[0]+$(e).html()+attach[1], attachment: attachment });
            attachment = {};
        } 
    });

    // GUARDAR LA PUBLICACIÓN
    let publication = {
        title: title,
        author: '',
        source: 'RT en Español',
        publishDate: publishDate,
        summary: summary,
        cover: {
            coverMultimedia: coverMultimedia,
            coverType: coverType,
            coverDescription: coverDescription,
            coverSource: coverSource
        },
        content: paragraphs
    };

    return publication;
}

module.exports = {
    getRT: async (req, res, next) => {
        const { url } = req.query;
        const news = await rtScraper(url);
        res.status(200).json(news);
    },
}