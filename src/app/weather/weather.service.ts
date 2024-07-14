import { HttpClient, HttpParams } from '@angular/common/http'
import { DestroyRef, inject, Injectable } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { environment } from '../../environments/environment'
import { ICurrentWeather } from '../interfaces'

interface ICurrentWeatherData {
  weather: [
    {
      description: string
      icon: string
    },
  ]
  main: {
    temp: number
  }
  sys: {
    country: string
  }
  dt: number
  name: string
}

export interface IWeatherService {
  readonly currentWeather$: BehaviorSubject<ICurrentWeather>
  getCurrentWeather(city: string, country: string): Observable<ICurrentWeather>
  getCurrentWeatherByCoords(coords: GeolocationCoordinates): Observable<ICurrentWeather>
  updateCurrentWeather(search: string | number, countr?: string): void
}

@Injectable({
  providedIn: 'root',
})
export class WeatherService implements IWeatherService {
  private destroyRef = inject(DestroyRef)
  readonly currentWeather$: BehaviorSubject<ICurrentWeather> = new BehaviorSubject({
    city: '--',
    country: '--',
    date: Date.now(),
    image: '',
    temperature: 0,
    description: '',
  })

  constructor(private httpClient: HttpClient) {}

  getCurrentWeather(
    search: string | number,
    country: string
  ): Observable<ICurrentWeather> {
    let uriParams = new HttpParams()

    if (typeof search === 'string') {
      uriParams = uriParams.set('q', country ? `${search}, ${country}` : search)
    } else {
      uriParams = uriParams.set('zip', search)
    }

    return this.getCurrentWeatherHelper(uriParams)
  }

  getCurrentWeatherByCoords(coords: Partial<GeolocationCoordinates>) {
    const uriParams = new HttpParams()
      .set('lat', coords?.latitude?.toString() || '')
      .set('lon', coords?.longitude?.toString() || '')

    return this.getCurrentWeatherHelper(uriParams)
  }

  private getCurrentWeatherHelper(uriParams: HttpParams) {
    uriParams = uriParams.set('appid', environment.appId)

    return this.httpClient
      .get<ICurrentWeatherData>(
        `${environment.baseUrl}api.openweathermap.org/data/2.5/weather`,
        { params: uriParams }
      )
      .pipe(map((data) => this.transformToICurrentWeather(data)))
  }

  private transformToICurrentWeather(data: ICurrentWeatherData): ICurrentWeather {
    return {
      city: data.name,
      country: data.sys.country,
      date: data.dt * 1000,
      image: `http://openweathermap.org/img/w/${data.weather[0].icon}.png`,
      temperature: this.convertKelvinToFahrenheit(data.main.temp),
      description: data.weather[0].description,
    }
  }

  private convertKelvinToFahrenheit(kelvin: number): number {
    return (kelvin * 9) / 5 - 459.67
  }

  updateCurrentWeather(search: string | number, country?: string) {
    this.getCurrentWeather(search, country || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.currentWeather$.next(data))
  }
}
