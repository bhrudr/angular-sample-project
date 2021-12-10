import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Recipe } from '../recipes/recipe.model';
import { RecipeService } from '../recipes/recipe.service';

@Injectable({ providedIn: 'root' })
export class DataStorageService {

    constructor(private http: HttpClient, private recipeServ: RecipeService, private authService: AuthService) {

    }

    storeRecipes() {
        const recipes = this.recipeServ.getRecipes();
        this.http.put('https://ng-course-recipe-book-829a8.firebaseio.com/recipes.json', recipes)
            .subscribe(response => {
                console.log(response);
            });
    }

    fetchRecipes() {

        return this.http.get<Recipe[]>('https://ng-course-recipe-book-829a8.firebaseio.com/recipes.json')
        .pipe(
            map(recipes => {
                return recipes.map(recipe => {
                    return { ...recipe, ingredients: recipe.ingredients ? recipe.ingredients : [] };
                });
            }),
            tap(recipes => {
                this.recipeServ.setRecipes(recipes);
            })
        );
    }
}