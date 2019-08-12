import axios from 'axios';

import { proxy, key } from '../config';

export default class Recipe {
    constructor(id) {
        this.id = id;
    }
    async getRecipe() {
        try {
           const res = await axios(`${proxy}http://food2fork.com/api/get?key=${key}&rId=${this.id}`);
           this.title = res.data.recipe.title;
           this.author = res.data.recipe.publisher;
           this.img = res.data.recipe.image_url;
           this.url = res.data.recipe.source_url;
           this.ingredients = res.data.recipe.ingredients;
        } catch (error) {
            console.log(error);
            alert('Something went wrong :(');
        }
    }

    calcTime() {
        //Assuming that we need 15 mins for each 3 ingredients
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng/3);
        this.time = periods * 15;
    }

    calcServings() {
        this.servings = 4;
    }

    parseIngredients() {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp' , 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
        const units = [...unitsShort, 'kg', 'g'];

        const newIngredients = this.ingredients.map(el => {
            // 1. Uniform units
            let ingredient = el.toLowerCase();
            unitsLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, unitsShort[i]);
            });

            // 2. Remove parentheses
            ingredient = ingredient.replace(/ *\([^)]*\) */g, ' ');

            // 3. Pare ingredients into count, unit and ingredient 
            const arrIng = ingredient.split(' ');
            const unitIndex = arrIng.findIndex(el2 => units.includes(el2));

            let objIng;
            if (unitIndex > -1) {
                // There is a unit
                //ex. 4 1/2 cups - arrCount is [4, 1/2] 
                //ex. 4 cups - arrCount is [4]
                const arrCount = arrIng.slice(0, unitIndex);

                let count;
                if (arrCount.length === 1) {
                    count = eval(arrIng[0].replace('-', '+')); //some ingredients have "1-1/3 cups" instead 1 1/3 cups"
                } else {
                    count = eval(arrIng.slice(0, unitIndex).join('+'));
                    //ex. 4 1/2 cups - arrCount is [4, 1/2] --> eval("4+1/2") returns 4.5 (int)
                }

                objIng = {
                    count,
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex + 1).join(' ')
                };

            } else if (parseInt(arrIng[0], 10)) {
                // There is no unit but 1st element is a number
                objIng = {
                    count: (parseInt(arrIng[0], 10)),
                    unit: '',
                    ingredient: arrIng.slice(1).join(' ') //taking the whole array except the first element (number) and converting back to a string
                };
            } else if (unitIndex === -1) {
                // There is no unit and no number in first position
                objIng = {
                    count: 1,
                    unit: '',
                    ingredient
                }
            }

            return objIng;
        });
        this.ingredients = newIngredients;
    }

    updateServings (type) {
        //Servings
        const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;

        //Ingredients
        this.ingredients.forEach(ing => {
            ing.count *= (newServings/this.servings);
        })

        this.servings = newServings;
    }
}