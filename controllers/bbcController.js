const fetch = require('node-fetch');
const cheerio  = require('cheerio');

const bbcScraper = async (url) => {

    // OBTENER HTML
    const res = await fetch(url);
    const data = await res.text();
    // CARGAR HTML A CHEERIO
    const $ = cheerio.load(data);
    // OBTENER EL TÍTULO DE LA PUBLICACIÓN
    let title = $('.story-body__h1').text();//.replace(/(\r\n|\n|\r)/gm,"").trim();
    // OBTENER EL AUTOR DE LA PUBLICACIÓN
    let author = $('.byline__name').text();
    // OBTENER FUENTE DE LA PUBLICACIÓN
    let source = $('.byline__title').text();
    // OBTENER FECHA DE LA PUBLICACIÓN
    let publishDate = $('.with-extracted-share-icons').find('.date--v2').text();
    // OBTENER MATERIAL MULTIMEDIA - DESCRIPCIÓN - FUENTE - TIPO
    let coverType;
    let coverDescription;
    let coverSource;
    let coverMultimedia = $('.story-body__inner').find('span.image-and-copyright-container')
        .children().attr('src');

    if(coverMultimedia != null)
        coverType = 'image';
    else {
        coverMultimedia = $('.story-body__inner').find('a.story-body__link-external').attr('href');
        if(coverMultimedia.includes('https://bbc.in')) {
            coverMultimedia = $('.story-body__inner').find('span.image-and-copyright-container')
            .children().attr('data-src');
            coverType = 'image';
        }
        else {
            coverType = 'video';
            coverDescription = $('.embed-youtube-warning').text();
            coverSource = 'BBC News Mundo'
        }
    }

    if(coverType == 'image') {
        coverMultimedia = coverMultimedia.split('/');
        coverMultimedia[4] = '1024';
        coverMultimedia = coverMultimedia.join('/');
        coverDescription =  $('.story-body__inner').find('.media-caption__text');
        coverDescription = $(coverDescription[0]).text().trim();
        coverSource = $('.story-body__inner').find('span.story-image-copyright');
        coverSource = $(coverSource[0]).text()
    }

    // OBTENER CONTENIDO DE LA PUBLICACIÓN
    let paragraphs = [];
    let attachment = {};

    $('.story-body__inner').children().each((i, e) => {

        if(e.tagName == 'p'){
            const linkImage = $(e).next().find('span.image-and-copyright-container');
            const txt = $(linkImage).find('.js-delayed-image-load').attr('data-src');
            if(txt != undefined && !txt.includes('line') && !txt.includes('banner')) {
                attachment.type = 'image';
                attachment.path = txt;
                attachment.path = attachment.path.split('/');
                attachment.path[4] = '1024';
                attachment.path = attachment.path.join('/');
                attachment.description = $(linkImage).next().find('.media-caption__text').text().trim();
                attachment.source = $(linkImage).find('.story-image-copyright').text();
            } 
            paragraphs.push({ paragraph: '<p>'+$(e).html()+'</p>', attachment: attachment });
            attachment = {};
        }
    });

    // GUARDAR LA PUBLICACIÓN
    let publication = {
        title: title,
        author: author,
        source: source,
        publishDate: publishDate,
        summary: '',
        cover: {
            coverMultimedia: coverMultimedia,
            coverDescription: coverDescription,
            coverSource: coverSource
        },
        content: paragraphs
    };

    return publication;
}

module.exports = {
    getBBC: async (req, res, next) => {
        const { url } = req.query;
        const news = await bbcScraper(url);
        res.status(200).json(news);
    },
}