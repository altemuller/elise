'use strict';

// Modules
const axios = require('axios');
const cheerio = require('cheerio');
const tableParser = require('cheerio-tableparser');
const textTable = require('text-table');
const ls = require('fast-levenshtein');

module.exports = class utils {
    static async getHeroes() {
        try {
            const { data } = await axios.get('https://feheroes.gamepedia.com/Hero_list');
            const $ = cheerio.load(data);
            tableParser($);

            const tableHeroes = $('table[style="text-align:center;width:100%"]').eq(0).parsetable(false, false, true);
            const tableHeroesNames = tableHeroes[1].slice(1);
            const tableHeroesTitles = tableHeroes[2].slice(1)

            this.heroes = [];
            for (let i = 0; i < tableHeroesNames.length; i++) {
                this.heroes.push(`${tableHeroesNames[i]}: ${tableHeroesTitles[i]}`);
            }

            this.heroes.sort();
            console.log(`Database update: ${ new Date() }`);
        } catch (error) {
            console.error(error);
        }
    }

    static heroVariations(hero) {
        let maxProbability = 0;
        let selectedHero = '';
        let heroVariations = [];

        this.heroes.forEach((heroName) => {
            let lsResult = ls.get(hero.toLowerCase(), heroName.toLowerCase().substring(0, heroName.indexOf(':')));
            let probability = Math.round((heroName.length - lsResult) * 100 / heroName.length);

            if (probability >= maxProbability) {
                maxProbability = probability;
                selectedHero = heroName;
            }
        });

        let selectedHeroName = selectedHero.substring(0, selectedHero.indexOf(':'));

        this.heroes.forEach((hero) => {
            let heroName = hero.substring(0, hero.indexOf(':'));
            if (heroName == selectedHeroName) {
                console.log(`Get IV: ${hero}.`);
                heroVariations.push(hero);
            }
        });

        return heroVariations;
    }

    static async heroParse(heroVariations, index, context) {
        try {
            const hero = heroVariations[index];
            const { data } = await axios.get(`https://feheroes.gamepedia.com/${hero.replace(/\s/g, '_')}`);
            const $ = cheerio.load(data);
            tableParser($);
    
            const min = $('table[style="text-align:center;width:500px"]').eq(0).parsetable(false, false, true);
            const max = $('table[style="text-align:center;width:500px"]').eq(1).parsetable(false, false, true);
            context.send(`${hero}\nMin:\n${textTable(min)}\n\nMax:\n${textTable(max)}`);
    
            index++;
            if (index != heroVariations.length) {
                this.heroParse(heroVariations, index, context);
            }
        } catch (error) {
            console.error(error);
        }
    }
}