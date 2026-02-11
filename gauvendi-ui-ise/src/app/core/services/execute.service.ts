import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { DocumentNode } from 'graphql';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@environment/environment';


interface FetchQueryOptions {
  query: DocumentNode;
  variables?: any;
}

interface MutationOptions {
  mutation: DocumentNode;
  variables?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ExecuteService {
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    })
  };

  private api = environment['graphqlUrl'] || `${environment.apiURL}/graphql`;

  constructor(
    private http: HttpClient
  ) { }

  runQuery({ query, variables }: FetchQueryOptions, customEndpoint?: string) {
    const apiUrl = customEndpoint ? `${customEndpoint}/graphql` : this.api;
    return this.http.post(apiUrl, {
      query: query.loc.source.body,
      variables
    }, this.httpOptions)
      .pipe(map(({ data }: any) => data));
  }

  runMutation({ mutation, variables }: MutationOptions, customEndpoint?: string) {
    const apiUrl = customEndpoint ? `${customEndpoint}/graphql` : this.api;
    return this.http.post(apiUrl, {
      query: mutation.loc.source.body,
      variables
    }, this.httpOptions)
      .pipe(map(({ data }: any) => data));
  }
}
