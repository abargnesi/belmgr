import {inject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import 'fetch';

import {LogManager} from 'aurelia-framework';

let logger = LogManager.getLogger('api');

let baseUrl = 'http://next.belframework.org/api';
let parse = message => JSON.parse(message.response);

// http://europepmc.org/RestfulWebService#search
// http://www.ebi.ac.uk/europepmc/webservices/rest/search/resulttype=core&format=json&query=src:med ext_id:1945500
let pubmedBaseUrl = 'http://www.ebi.ac.uk/europepmc/webservices/rest/search';

export class Api {

  constructor() {

    this.apiClient = new HttpClient();
    // this.apiClient.baseUrl = baseUrl;
    this.apiClient.configure(config => {
      config
        .withBaseUrl(baseUrl)
        .withDefaults({
          headers: {
            'Accept'          : 'application/json',
            'X-Requested-With': 'Fetch'
          }
        })
        .rejectErrorResponses()
        .withInterceptor({
          request(request) {
            console.log(`Requesting ${request.method} ${request.url}`);
            return request; // you can return a modified Request, or you can short-circuit the request by returning a
                            // Response
          },
          response(response) {
            console.log(`Received ${response.status} ${response.url}`);
            return response; // you can return a modified Response
          }
        });
    });

//    this.pubmedClient = new HttpClient();
//    this.pubmedClient.baseUrl = pubmedBaseUrl;

  }


  /**
   * <p>Process facets from search</p>
   * <p>This removes the facets that won't be used in the search results page
   *    and reorganizes it for presentation in the search results page.
   * </p>
   *
   * @param {Object} facets - facets returned by BEL API from search
   * @returns {Object} facets - facets after processing to be used in web page
   * */
  process_facets(facets) {
    let new_facets = {};

    for (let facet of facets) {
      // logger.debug("Facet: ", facet);
      if (facet.category === 'experiment_context' || facet.name === 'Status') {
        // logger.debug("Status Facet: ", facet);
        new_facets[facet.name] = {};
        for (let value of facet.values) {
          let name = value["value"];
          new_facets[facet.name][name] = {
            'count' : value.count,
            'filter' : value.filter
          };
        }
      }
    }

    return new_facets;
  }

  /**
   * Search the BELMgr database and return website ready results
   *
   * @param {String} filter - search string
   * @param {Integer} start - result page starting point (default = 0)
   * @param {Integer} size - number of results returned (default = 10)
   * @param {Integer} faceted - facet results if equals 1 (default = 1)
   * @return {Promise} data - processed search results ready to display on the search results web page
   * */
  search(start = 0, size = 10, faceted = "yes") {
    let max_values_per_facet = 20;
    let getstring = `/evidence?start=${start}&size=${size}&faceted=${faceted}&max_values_per_facet=${max_values_per_facet}`;

    return this.apiClient.fetch(getstring)
      .then(response => response.json())
      .then(data => {
              let new_data = {};
              new_data['evidences'] = data.evidence;
              new_data['facets'] = this.process_facets(data.facets);
              return new_data;
            })
      .catch(function (reason) {
               console.log(`Search Error: ${reason}`)
             });
  }

//  getPubmed(id) {
//    let getstring = `/resulttype=core&format=json&query=src:med ext_id:${id}`;
//    let results = {};
//    return this.pubmedClient.fetch(getstring)
//      .then(response => response.json())
//      .catch(function(reason) {console.log(`getPubmed Error: ${reason}`)});
//  }
//      this.api.getPubmed('1945500')
//        .then(results => console.log(results))
//        .catch(reason => console.log(`Pubmed Error: ${reason}`));

}