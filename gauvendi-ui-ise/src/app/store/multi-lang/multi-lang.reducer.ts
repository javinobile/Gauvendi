import {Action, createReducer, on} from '@ngrx/store';
import {MultiLangState} from "@store/multi-lang/multi-lang.state";
import {loadedStaticContentSuccessfully} from "@store/multi-lang/multi-lang.actions";
import {ELoadingStatus} from "@models/loading-status.model";

const initialState: MultiLangState = {
  data: null,
  status: ELoadingStatus.idle,
  error: null
};

// @ts-ignore
const reducer = createReducer(
  initialState,
  on(loadedStaticContentSuccessfully, (state, {contents}) => ({
    data: contents,
    status: ELoadingStatus.loaded,
    error: null
  }))
);

export function multiLangReducer(state: MultiLangState, action: Action) {
  return reducer(state, action);
}
