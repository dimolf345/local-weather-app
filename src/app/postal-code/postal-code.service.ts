import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { defaultIfEmpty, mergeMap, Observable } from 'rxjs'
import { environment } from 'src/environments/environment'

export interface IPostalCode {
  countryCode: string
  postalCode: string
  placeName: string
  lng: number
  lat: number
}

export interface IPostalCodeData {
  postalcodes: [IPostalCode]
}

export interface IPostalCodeService {
  resolvePostalCode(postalCode: string): Observable<IPostalCode | null>
}

@Injectable({
  providedIn: 'root',
})
export class PostalCodeService implements IPostalCodeService {
  #http = inject(HttpClient)

  resolvePostalCode(postalCode: string, country = ''): Observable<IPostalCode | null> {
    const uriParams = new HttpParams()
      .set('maxRows', 1)
      .set('username', environment.username)
      .set('postalcode', postalCode)
      .set('country', country)

    const { baseUrl, geonamesApi } = environment

    return this.#http
      .get<IPostalCodeData>(
        `${baseUrl}${geonamesApi}.geonames.org/postalCodeLookupJSON`,
        { params: uriParams }
      )
      .pipe(
        mergeMap((data) => data.postalcodes),
        defaultIfEmpty(null)
      )
  }
}
