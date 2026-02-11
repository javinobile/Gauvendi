import {ActionReducer, ActionReducerMap, MetaReducer} from '@ngrx/store';


import {routerReducer} from '@ngrx/router-store';
import {RouterReducerState} from '@ngrx/router-store/src/reducer';
import {environment} from "@environment/environment";

export interface AppState
{
  router: RouterReducerState;
}

export const reducers: ActionReducerMap<AppState> = {
  router: routerReducer
};

export function logger(reducer: ActionReducer<any>)
  : ActionReducer<any>
{
  return (state, action) => reducer(state, action);
}

export const metaReducers: MetaReducer<AppState>[] =
  !environment.production ? [logger] : [];


