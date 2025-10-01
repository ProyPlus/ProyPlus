// src/app/models/investor.model.ts
export enum Province {
  BUENOS_AIRES = 'BUENOS_AIRES',
  CABA = 'CABA',
  CATAMARCA = 'CATAMARCA',
  CHACO = 'CHACO',
  CHUBUT = 'CHUBUT',
  CORDOBA = 'CORDOBA',
  CORRIENTES = 'CORRIENTES',
  ENTRE_RIOS = 'ENTRE_RIOS',
  FORMOSA = 'FORMOSA',
  JUJUY = 'JUJUY',
  LA_PAMPA = 'LA_PAMPA',
  LA_RIOJA = 'LA_RIOJA',
  MENDOZA = 'MENDOZA',
  MISIONES = 'MISIONES',
  NEUQUEN = 'NEUQUEN',
  RIO_NEGRO = 'RIO_NEGRO',
  SALTA = 'SALTA',
  SAN_JUAN = 'SAN_JUAN',
  SAN_LUIS = 'SAN_LUIS',
  SANTA_CRUZ = 'SANTA_CRUZ',
  SANTA_FE = 'SANTA_FE',
  SANTIAGO_DEL_ESTERO = 'SANTIAGO_DEL_ESTERO',
  TIERRA_DEL_FUEGO = 'TIERRA_DEL_FUEGO',
  TUCUMAN = 'TUCUMAN'
}

export interface Address {
  street: string;
  number: number;
  city: string;
  province: Province;
  postalCode: number;
}

export interface Investor {
  id?: number;
  username: string;
  password: string;
  email: string;
  cuit: string;
  contactPerson: string;
  phone: string;
  webSite?: string;
  address?: Address;
  enabled?: boolean;
  accountNotExpired?: boolean;
  accountNotLocked?: boolean;
  credentialNotExpired?: boolean;
}
