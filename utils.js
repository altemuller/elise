const rp = require('request-promise');
const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const table = require('text-table');
const levenshtein = require('fast-levenshtein');

let heroes = [];

async function getHeroes() {
    const options = {
        uri: `https://feheroes.gamepedia.com/Hero_list`,
        transform: function (body) {
          return cheerio.load(body);
        }
    }
    
    rp(options).then(($) => {
        cheerioTableparser($);
        let table = $('table[style="text-align:center;width:100%"]').eq(0).parsetable(false, false, true);
        let name = table[1].slice(1, table[1].length);
        let title = table[2].slice(1, table[1].length);
        heroes = [];
        for (let i = 0; i < name.length; i++) {
            heroes.push(`${name[i]}: ${title[i]}`);
        }
        heroes.sort();
        console.log('Database heroes update in ' + new Date());
        return heroes;
    }).catch((error) => {
        console.error(error);
    })
}

async function heroSearch(hero, heroes) {
    let heroName = hero;
    let selectedHero = '';
    let heroVariations = [];
    let maxProbability = 0;
    
    heroes.forEach((dbHeroName) => {
        let levenshteinResult = levenshtein.get(heroName.toLowerCase(), dbHeroName.toLowerCase().substring(0, dbHeroName.indexOf(':')));
        let probability = Math.round((dbHeroName.length - levenshteinResult) * 100 / dbHeroName.length);
        
        if (probability >= maxProbability) {
            maxProbability = probability;
            selectedHero = dbHeroName;
        }
    })

    let selectedHeroName = selectedHero.substring(0, selectedHero.indexOf(':'));

    heroes.forEach((hero) => {
        let heroName = hero.substring(0, hero.indexOf(':'));
        if (heroName == selectedHeroName) {
            console.log(`Get IV: ${hero}.`);
            heroVariations.push(hero);
        }
    })

    return heroVariations;
}

function heroParse(heroVariations, index, context) {
    let hero = heroVariations[index];
    const options = {
        uri: `https://feheroes.gamepedia.com/${hero.replace(/\s/g, '_')}`,
        transform: function (body) {
          return cheerio.load(body);
        }
    }

    rp(options).then(($) => {
        cheerioTableparser($);
        let min = $('table[style="text-align:center;width:500px"]').eq(0).parsetable(false, false, true);
        let max = $('table[style="text-align:center;width:500px"]').eq(1).parsetable(false, false, true);
        context.send(`${hero}\nMin:\n${table(min)}\n\nMax:\n${table(max)}`);
        index++;
        if (index != heroVariations.length) {
            heroParse(heroVariations, index, context);
        }
    }).catch((error) => {
        console.error(error)
    })
}

function getHeroesStatic() {
    return heroes;
}

module.exports.getHeroes = getHeroes;
module.exports.heroSearch = heroSearch;
module.exports.heroParse = heroParse;
module.exports.getHeroesStatic = getHeroesStatic;