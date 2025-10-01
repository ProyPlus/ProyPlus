// src/app/model/student.model.ts
export enum DegreeStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
  ABANDONED = 'ABANDONED'
}

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

export enum University {
  UBA = 'UBA', ITBA = 'ITBA', UADE = 'UADE', UAI = 'UAI', UCES = 'UCES', USAL = 'USAL',
  AUSTRAL = 'AUSTRAL', TORCUATO_DI_TELLA = 'TORCUATO_DI_TELLA', ISALUD = 'ISALUD',
  UNLP = 'UNLP', UNLAM = 'UNLAM', UNGS = 'UNGS', UNAHUR = 'UNAHUR', UNLu = 'UNLu', UNPAZ = 'UNPAZ', UNMdP = 'UNMdP', UNLZ = 'UNLZ',
  UNC = 'UNC', UCC = 'UCC', UTN_CORDOBA = 'UTN_CORDOBA', UNIVERSIDAD_CATOLICA_DE_CORDOBA = 'UNIVERSIDAD_CATOLICA_DE_CORDOBA',
  UNR = 'UNR', UCA_SANTA_FE = 'UCA_SANTA_FE', UTN_SANTA_FE = 'UTN_SANTA_FE',
  UNCuyo = 'UNCuyo', UCC_MENDOZA = 'UCC_MENDOZA', UTN_MENDOZA = 'UTN_MENDOZA',
  UNER = 'UNER', UCU = 'UCU',
  UNT = 'UNT', UCSE_TUCUMAN = 'UCSE_TUCUMAN', UTN_TUCUMAN = 'UTN_TUCUMAN',
  UNRN = 'UNRN', UAI_RN = 'UAI_RN',
  UNSa = 'UNSa', UCASAL = 'UCASAL',
  UNaM = 'UNaM', UCAMI = 'UCAMI',
  UNNE = 'UNNE', UCALCHA = 'UCALCHA'
}

export interface Address {
  street: string;
  number: number;
  city: string;
  province: Province;
  postalCode: number;
}

export interface Student {
  id: number;
  username: string;
  password: string;
  email: string;
  photoUrl?: string;
  enabled: boolean;
  accountNotExpired: boolean;
  accountNotLocked: boolean;
  credentialNotExpired: boolean;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  dateOfBirth: string;
  university: University;
  career: string;
  degreeStatus: DegreeStatus;
  linkedinUrl?: string;
  description?: string;
  address?: Address;
}
