// Swedish municipalities and their recommended SWEREF 99 local projection systems.
// Source: Lantmäteriet.

export interface Municipality {
  name: string;
  county: string;
  projection: string;
  projectionId: string;
  lat: number;
  lon: number;
}

// Representative latitude coordinates of Swedish counties (län) for regional grouping & staggering
export const COUNTY_LATITUDES: Record<string, number> = {
  "Norrbottens län": 66.5,
  "Västerbottens län": 64.8,
  "Jämtlands län": 63.2,
  "Västernorrlands län": 62.8,
  "Gävleborgs län": 61.3,
  "Dalarnas län": 61.0,
  "Värmlands län": 59.8,
  "Örebro län": 59.3,
  "Västmanlands län": 59.6,
  "Uppsalas län": 59.9,
  "Uppsala län": 59.9, // variation handle
  "Stockholms län": 59.3,
  "Södermanlands län": 59.0,
  "Östergötlands län": 58.4,
  "Västra Götalands län": 58.0,
  "Jönköpings län": 57.5,
  "Hallands län": 56.9,
  "Kronobergs län": 56.7,
  "Kalmar län": 57.0,
  "Gotlands län": 57.5,
  "Blekinge län": 56.3,
  "Skåne län": 55.9
};

// Exact coordinates for primary cities / municipalities to ensure maximum accuracy
export const MUNICIPALITY_OVERRIDES: Record<string, { lat: number; lon: number }> = {
  "Stockholm": { lat: 59.3293, lon: 18.0686 },
  "Göteborg": { lat: 57.7088, lon: 11.9745 },
  "Malmö": { lat: 55.6050, lon: 13.0038 },
  "Umeå": { lat: 63.8258, lon: 20.2630 },
  "Uppsala": { lat: 59.8585, lon: 17.6389 },
  "Västerås": { lat: 59.6109, lon: 16.5448 },
  "Örebro": { lat: 59.2752, lon: 15.2134 },
  "Linköping": { lat: 58.4108, lon: 15.6215 },
  "Jönköping": { lat: 57.7826, lon: 14.1617 },
  "Norrköping": { lat: 58.5878, lon: 16.1819 },
  "Helsingborg": { lat: 56.0464, lon: 12.6945 },
  "Borås": { lat: 57.7210, lon: 12.9398 },
  "Halmstad": { lat: 56.6743, lon: 12.8577 },
  "Gävle": { lat: 60.6748, lon: 17.1412 },
  "Eskilstuna": { lat: 59.3716, lon: 16.5110 },
  "Karlstad": { lat: 59.3793, lon: 13.5086 },
  "Trollhättan": { lat: 58.2834, lon: 12.2858 },
  "Östersund": { lat: 63.1767, lon: 14.6361 },
  "Sundsvall": { lat: 62.3908, lon: 17.3069 },
  "Luleå": { lat: 65.5848, lon: 22.1567 },
  "Kiruna 1": { lat: 67.8557, lon: 18.7500 },
  "Kiruna 2": { lat: 67.8557, lon: 20.2500 },
  "Kiruna 3": { lat: 68.1000, lon: 21.7500 },
  "Kiruna 4": { lat: 68.3000, lon: 23.2500 },
  "Arjeplog": { lat: 65.8790, lon: 17.8870 },
  "Arvidsjaur": { lat: 65.5900, lon: 19.1700 },
  "Boden": { lat: 65.8251, lon: 21.6887 },
  "Haparanda": { lat: 65.8354, lon: 24.1311 },
  "Jokkmokk": { lat: 66.6022, lon: 19.8322 },
  "Gällivare": { lat: 67.1352, lon: 20.6601 },
  "Kalix": { lat: 65.8554, lon: 23.1384 },
  "Pajala": { lat: 67.2094, lon: 23.3661 },
  "Piteå": { lat: 65.3172, lon: 21.4794 },
  "Överkalix": { lat: 66.3533, lon: 22.8422 },
  "Övertorneå": { lat: 66.3881, lon: 23.6558 }
};

// Maps SWEREF name to standard projection IDs
export const SWEREF_NAME_TO_ID: Record<string, string> = {
  "SWEREF 99 12 00": "sweref99_1200",
  "SWEREF 99 13 30": "sweref99_1330",
  "SWEREF 99 14 15": "sweref99_1415",
  "SWEREF 99 15 00": "sweref99_1500",
  "SWEREF 99 15 45": "sweref99_1545",
  "SWEREF 99 16 30": "sweref99_1630",
  "SWEREF 99 17 15": "sweref99_1715",
  "SWEREF 99 18 00": "sweref99_1800",
  "SWEREF 99 18 45": "sweref99_1845",
  "SWEREF 99 20 15": "sweref99_2015",
  "SWEREF 99 21 45": "sweref99_2145",
  "SWEREF 99 23 15": "sweref99_2315"
};

// Central meridians for Sweref local systems to dynamically estimate longitude
export const SWEREF_NAME_TO_MERIDIAN: Record<string, number> = {
  "SWEREF 99 12 00": 12.0,
  "SWEREF 99 13 30": 13.5,
  "SWEREF 99 14 15": 14.25,
  "SWEREF 99 15 00": 15.0,
  "SWEREF 99 15 45": 15.75,
  "SWEREF 99 16 30": 16.5,
  "SWEREF 99 17 15": 17.25,
  "SWEREF 99 18 00": 18.0,
  "SWEREF 99 18 45": 18.75,
  "SWEREF 99 20 15": 20.25,
  "SWEREF 99 21 45": 21.75,
  "SWEREF 99 23 15": 23.25
};

// Raw semicolon-separated list of "Kommun;Län;SWEREF 99 XX YY"
const RAW_MUNICIPALITIES_DATA = `Ale;Västra Götalands län;SWEREF 99 12 00
Alingsås;Västra Götalands län;SWEREF 99 12 00
Alvesta;Kronobergs län;SWEREF 99 15 00
Aneby;Jönköpings län;SWEREF 99 15 00
Arboga;Västmanlands län;SWEREF 99 16 30
Arjeplog;Norrbottens län;SWEREF 99 17 15
Arvidsjaur;Norrbottens län;SWEREF 99 18 45
Arvika;Värmlands län;SWEREF 99 12 00
Askersund;Örebro län;SWEREF 99 15 00
Avesta;Dalarnas län;SWEREF 99 16 30
Bengtsfors;Västra Götalands län;SWEREF 99 12 00
Berg;Jämtlands län;SWEREF 99 14 15
Bjurholm;Västerbottens län;SWEREF 99 18 45
Bjuv;Skåne län;SWEREF 99 13 30
Boden;Norrbottens län;SWEREF 99 21 45
Bollebygd;Västra Götalands län;SWEREF 99 13 30
Bollnäs;Gävleborgs län;SWEREF 99 16 30
Borgholm;Kalmar län;SWEREF 99 16 30
Borlänge;Dalarnas län;SWEREF 99 15 45
Borås;Västra Götalands län;SWEREF 99 13 30
Botkyrka;Stockholms län;SWEREF 99 18 00
Boxholm;Östergötlands län;SWEREF 99 15 00
Bromölla;Skåne län;SWEREF 99 13 30
Bräcke;Jämtlands län;SWEREF 99 15 45
Burlöv;Skåne län;SWEREF 99 13 30
Båstad;Skåne län;SWEREF 99 13 30
Dals-Ed;Västra Götalands län;SWEREF 99 12 00
Danderyd;Stockholms län;SWEREF 99 18 00
Degerfors;Örebro län;SWEREF 99 15 00
Dorotea;Västerbottens län;SWEREF 99 15 45
Eda;Värmlands län;SWEREF 99 12 00
Ekerö;Stockholms län;SWEREF 99 18 00
Eksjö;Jönköpings län;SWEREF 99 15 00
Emmaboda;Kalmar län;SWEREF 99 15 00
Enköping;Uppsalas län;SWEREF 99 16 30
Eskilstuna;Södermanlands län;SWEREF 99 16 30
Eslöv;Skåne län;SWEREF 99 13 30
Essunga;Västra Götalands län;SWEREF 99 13 30
Fagersta;Västmanlands län;SWEREF 99 16 30
Falkenberg;Hallands län;SWEREF 99 12 00
Falköping;Västra Götalands län;SWEREF 99 13 30
Falun;Dalarnas län;SWEREF 99 15 45
Filipstad;Värmlands län;SWEREF 99 13 30
Finspång;Östergötlands län;SWEREF 99 16 30
Flen;Södermanlands län;SWEREF 99 16 30
Forshaga;Värmlands län;SWEREF 99 13 30
Färgelanda;Västra Götalands län;SWEREF 99 12 00
Gagnef;Dalarnas län;SWEREF 99 15 00
Gislaved;Jönköpings län;SWEREF 99 13 30
Gnesta;Södermanlands län;SWEREF 99 16 30
Gnosjö;Jönköpings län;SWEREF 99 13 30
Gotland;Gotlands län;SWEREF 99 18 45
Grums;Värmlands län;SWEREF 99 13 30
Grästorp;Västra Götalands län;SWEREF 99 13 30
Gullspång;Västra Götalands län;SWEREF 99 13 30
Gällivare;Norrbottens län;SWEREF 99 20 15
Gävle;Gävleborgs län;SWEREF 99 16 30
Göteborg;Västra Götalands län;SWEREF 99 12 00
Götene;Västra Götalands län;SWEREF 99 13 30
Habo;Jönköpings län;SWEREF 99 13 30
Hagfors;Värmlands län;SWEREF 99 13 30
Hallsberg;Örebro län;SWEREF 99 15 00
Hallstahammar;Västmanlands län;SWEREF 99 16 30
Halmstad;Hallands län;SWEREF 99 13 30
Hammarö;Värmlands län;SWEREF 99 13 30
Haninge;Stockholms län;SWEREF 99 18 00
Haparanda;Norrbottens län;SWEREF 99 23 15
Heby;Uppsalas län;SWEREF 99 16 30
Hedemora;Dalarnas län;SWEREF 99 15 45
Helsingborg;Skåne län;SWEREF 99 13 30
Herrljunga;Västra Götalands län;SWEREF 99 13 30
Hjo;Västra Götalands län;SWEREF 99 13 30
Hofors;Gävleborgs län;SWEREF 99 16 30
Huddinge;Stockholms län;SWEREF 99 18 00
Hudiksvall;Gävleborgs län;SWEREF 99 16 30
Hultsfred;Kalmar län;SWEREF 99 16 30
Hylte;Hallands län;SWEREF 99 13 30
Håbo;Uppsalas län;SWEREF 99 18 00
Hällefors;Örebro län;SWEREF 99 15 00
Härjedalen;Jämtlands län;SWEREF 99 14 15
Härnösand;Västernorrlands län;SWEREF 99 17 15
Härryda;Västra Götalands län;SWEREF 99 12 00
Hässleholm;Skåne län;SWEREF 99 13 30
Höganäs;Skåne län;SWEREF 99 13 30
Högsby;Kalmar län;SWEREF 99 16 30
Hörby;Skåne län;SWEREF 99 13 30
Höör;Skåne län;SWEREF 99 13 30
Jokkmokk;Norrbottens län;SWEREF 99 20 15
Järfälla;Stockholms län;SWEREF 99 18 00
Jönköping;Jönköpings län;SWEREF 99 13 30
Kalix;Norrbottens län;SWEREF 99 23 15
Kalmar;Kalmar län;SWEREF 99 16 30
Karlsborg;Västra Götalands län;SWEREF 99 13 30
Karlshamn;Blekinge län;SWEREF 99 15 00
Karlskoga;Örebro län;SWEREF 99 15 00
Karlskrona;Blekinge län;SWEREF 99 15 00
Karlstad;Värmlands län;SWEREF 99 13 30
Katrineholm;Södermanlands län;SWEREF 99 16 30
Kil;Värmlands län;SWEREF 99 13 30
Kinda;Östergötlands län;SWEREF 99 15 00
Kiruna 1;Norrbottens län;SWEREF 99 18 45
Kiruna 2;Norrbottens län;SWEREF 99 20 15
Kiruna 3;Norrbottens län;SWEREF 99 21 45
Kiruna 4;Norrbottens län;SWEREF 99 23 15
Klippan;Skåne län;SWEREF 99 13 30
Knivsta;Uppsala län;SWEREF 99 18 00
Kramfors;Västernorrlands län;SWEREF 99 17 15
Kristianstad;Skåne län;SWEREF 99 13 30
Kristinehamn;Värmlands län;SWEREF 99 13 30
Krokom;Jämtlands län;SWEREF 99 14 15
Kumla;Örebro län;SWEREF 99 15 00
Kungsbacka;Hallands län;SWEREF 99 12 00
Kungsör;Västmanlands län;SWEREF 99 16 30
Kungälv;Västra Götalands län;SWEREF 99 12 00
Kävlinge;Skåne län;SWEREF 99 13 30
Köping;Västmanlands län;SWEREF 99 16 30
Laholm;Hallands län;SWEREF 99 13 30
Landskrona;Skåne län;SWEREF 99 13 30
Laxå;Örebro län;SWEREF 99 15 00
Lekeberg;Örebro län;SWEREF 99 15 00
Leksand;Dalarnas län;SWEREF 99 15 00
Lerum;Västra Götalands län;SWEREF 99 12 00
Lessebo;Kronobergs län;SWEREF 99 15 00
Lidingö;Stockholms län;SWEREF 99 18 00
Lidköping;Västra Götalands län;SWEREF 99 13 30
Lilla Edet;Västra Götalands län;SWEREF 99 12 00
Lindesberg;Örebro län;SWEREF 99 15 00
Linköping;Östergötlands län;SWEREF 99 15 00
Ljungby;Kronobergs län;SWEREF 99 13 30
Ljusdal;Gävleborgs län;SWEREF 99 16 30
Ljusnarsberg;Örebro län;SWEREF 99 15 00
Lomma;Skåne län;SWEREF 99 13 30
Ludvika;Dalarnas län;SWEREF 99 15 00
Luleå;Norrbottens län;SWEREF 99 21 45
Lund;Skåne län;SWEREF 99 13 30
Lycksele;Västerbottens län;SWEREF 99 18 45
Lysekil;Västra Götalands län;SWEREF 99 12 00
Malmö;Skåne län;SWEREF 99 13 30
Malung-Sälen;Dalarnas län;SWEREF 99 13 30
Malå;Västerbottens län;SWEREF 99 18 45
Mariestad;Västra Götalands län;SWEREF 99 13 30
Mark;Västra Götalands län;SWEREF 99 12 00
Markaryd;Kronobergs län;SWEREF 99 13 30
Mellerud;Västra Götalands län;SWEREF 99 12 00
Mjölby;Östergötlands län;SWEREF 99 15 00
Mora;Dalarnas län;SWEREF 99 15 00
Motala;Östergötlands län;SWEREF 99 15 00
Mullsjö;Jönköpings län;SWEREF 99 13 30
Munkedal;Västra Götalands län;SWEREF 99 12 00
Munkfors;Värmlands län;SWEREF 99 13 30
Mölndal;Västra Götalands län;SWEREF 99 12 00
Mönsterås;Kalmar län;SWEREF 99 16 30
Mörbylånga;Kalmar län;SWEREF 99 16 30
Nacka;Stockholms län;SWEREF 99 18 00
Nora;Örebro län;SWEREF 99 15 00
Norberg;Västmanlands län;SWEREF 99 16 30
Nordanstig;Gävleborgs län;SWEREF 99 16 30
Nordmaling;Västerbottens län;SWEREF 99 20 15
Norrköping;Östergötlands län;SWEREF 99 16 30
Norrtälje;Stockholms län;SWEREF 99 18 00
Norsjö;Västerbottens län;SWEREF 99 18 45
Nybro;Kalmar län;SWEREF 99 16 30
Nykvarn;Stockholms län;SWEREF 99 18 00
Nyköping;Södermanlands län;SWEREF 99 16 30
Nynäshamn;Stockholms län;SWEREF 99 18 00
Nässjö;Jönköpings län;SWEREF 99 15 00
Ockelbo;Gävleborgs län;SWEREF 99 16 30
Olofström;Blekinge län;SWEREF 99 15 00
Orsa;Dalarnas län;SWEREF 99 15 00
Orust;Västra Götalands län;SWEREF 99 12 00
Osby;Skåne län;SWEREF 99 13 30
Oskarshamn;Kalmar län;SWEREF 99 16 30
Ovanåker;Gävleborgs län;SWEREF 99 16 30
Oxelösund;Södermanlands län;SWEREF 99 16 30
Pajala;Norrbottens län;SWEREF 99 23 15
Partille;Västra Götalands län;SWEREF 99 12 00
Perstorp;Skåne län;SWEREF 99 13 30
Piteå;Norrbottens län;SWEREF 99 21 45
Ragunda;Jämtlands län;SWEREF 99 15 45
Robertsfors;Västerbottens län;SWEREF 99 20 15
Ronneby;Blekinge län;SWEREF 99 15 00
Rättvik;Dalarnas län;SWEREF 99 15 00
Sala;Västmanlands län;SWEREF 99 16 30
Salem;Stockholms län;SWEREF 99 18 00
Sandviken;Gävleborgs län;SWEREF 99 16 30
Sigtuna;Stockholms län;SWEREF 99 18 00
Simrishamn;Skåne län;SWEREF 99 13 30
Sjöbo;Skåne län;SWEREF 99 13 30
Skara;Västra Götalands län;SWEREF 99 13 30
Skellefteå;Västerbottens län;SWEREF 99 20 15
Skinnskatteberg;Västmanlands län;SWEREF 99 16 30
Skurup;Skåne län;SWEREF 99 13 30
Skövde;Västra Götalands län;SWEREF 99 13 30
Smedjebacken;Dalarnas län;SWEREF 99 15 00
Sollefteå;Västernorrlands län;SWEREF 99 17 15
Sollentuna;Stockholms län;SWEREF 99 18 00
Solna;Stockholms län;SWEREF 99 18 00
Sorsele;Västerbottens län;SWEREF 99 17 15
Sotenäs;Västra Götalands län;SWEREF 99 12 00
Staffanstorp;Skåne län;SWEREF 99 13 30
Stenungsund;Västra Götalands län;SWEREF 99 12 00
Stockholm;Stockholms län;SWEREF 99 18 00
Storfors;Värmlands län;SWEREF 99 13 30
Storuman;Västerbottens län;SWEREF 99 15 45
Strängnäs;Södermanlands län;SWEREF 99 16 30
Strömstad;Västra Götalands län;SWEREF 99 12 00
Strömsund;Jämtlands län;SWEREF 99 15 45
Sundbyberg;Stockholms län;SWEREF 99 18 00
Sundsvall;Västernorrlands län;SWEREF 99 17 15
Sunne;Värmlands län;SWEREF 99 13 30
Surahammar;Västmanlands län;SWEREF 99 16 30
Svalöv;Skåne län;SWEREF 99 13 30
Svedala;Skåne län;SWEREF 99 13 30
Svenljunga;Västra Götalands län;SWEREF 99 13 30
Säffle;Värmlands län;SWEREF 99 13 30
Säter;Dalarnas län;SWEREF 99 15 45
Sävsjö;Jönköpings län;SWEREF 99 15 00
Söderhamn;Gävleborgs län;SWEREF 99 16 30
Söderköping;Östergötlands län;SWEREF 99 16 30
Södertälje;Stockholms län;SWEREF 99 18 00
Sölvesborg;Blekinge län;SWEREF 99 15 00
Tanum;Västra Götalands län;SWEREF 99 12 00
Tibro;Västra Götalands län;SWEREF 99 13 30
Tidaholm;Västra Götalands län;SWEREF 99 13 30
Tierp;Uppsala län;SWEREF 99 18 00
Timrå;Västernorrlands län;SWEREF 99 17 15
Tingsryd;Kronobergs län;SWEREF 99 15 00
Tjörn;Västra Götalands län;SWEREF 99 12 00
Tomelilla;Skåne län;SWEREF 99 13 30
Torsby;Värmlands län;SWEREF 99 13 30
Torsås;Kalmar län;SWEREF 99 16 30
Tranemo;Västra Götalands län;SWEREF 99 13 30
Tranås;Jönköpings län;SWEREF 99 15 00
Trelleborg;Skåne län;SWEREF 99 13 30
Trollhättan;Västra Götalands län;SWEREF 99 12 00
Trosa;Södermanlands län;SWEREF 99 18 00
Tyresö;Stockholms län;SWEREF 99 18 00
Täby;Stockholms län;SWEREF 99 18 00
Töreboda;Västra Götalands län;SWEREF 99 13 30
Uddevalla;Västra Götalands län;SWEREF 99 12 00
Ulricehamn;Västra Götalands län;SWEREF 99 13 30
Umeå;Västerbottens län;SWEREF 99 20 15
Upplands-Bro;Stockholms län;SWEREF 99 18 00
Upplands Väsby;Stockholms län;SWEREF 99 18 00
Uppsala;Uppsala län;SWEREF 99 18 00
Uppvidinge;Kronobergs län;SWEREF 99 15 00
Vadstena;Östergötlands län;SWEREF 99 15 00
Vaggeryd;Jönköpings län;SWEREF 99 13 30
Valdemarsvik;Östergötlands län;SWEREF 99 16 30
Vallentuna;Stockholms län;SWEREF 99 18 00
Vansbro;Dalarnas län;SWEREF 99 15 00
Vara;Västra Götalands län;SWEREF 99 13 30
Varberg;Hallands län;SWEREF 99 12 00
Vaxholm;Stockholms län;SWEREF 99 18 00
Vellinge;Skåne län;SWEREF 99 13 30
Vetlanda;Jönköpings län;SWEREF 99 15 00
Vilhelmina;Västerbottens län;SWEREF 99 15 45
Vimmerby;Kalmar län;SWEREF 99 16 30
Vindeln;Västerbottens län;SWEREF 99 20 15
Vingåker;Södermanlands län;SWEREF 99 16 30
Vårgårda;Västra Götalands län;SWEREF 99 13 30
Vänersborg;Västra Götalands län;SWEREF 99 12 00
Vännäs;Västerbottens län;SWEREF 99 20 15
Värmdö;Stockholms län;SWEREF 99 18 00
Värnamo;Jönköpings län;SWEREF 99 13 30
Västervik;Kalmar län;SWEREF 99 16 30
Västerås;Västmanlands län;SWEREF 99 16 30
Växjö;Kronobergs län;SWEREF 99 15 00
Ydre;Östergötlands län;SWEREF 99 15 00
Ystad;Skåne län;SWEREF 99 13 30
Åmål;Västra Götalands län;SWEREF 99 12 00
Ånge;Västernorrlands län;SWEREF 99 15 45
Åre;Jämtlands län;SWEREF 99 14 15
Årjäng;Värmlands län;SWEREF 99 12 00
Åsele;Västerbottens län;SWEREF 99 17 15
Åstorp;Skåne län;SWEREF 99 13 30
Åtvidaberg;Östergötlands län;SWEREF 99 16 30
Älmhult;Kronobergs län;SWEREF 99 13 30
Älvdalen;Dalarnas län;SWEREF 99 13 30
Älvkarleby;Uppsala län;SWEREF 99 16 30
Älvsbyn;Norrbottens län;SWEREF 99 21 45
Ängelholm;Skåne län;SWEREF 99 13 30
Öckerö;Västra Götalands län;SWEREF 99 12 00
Ödeshög;Östergötlands län;SWEREF 99 15 00
Örebro;Örebro län;SWEREF 99 15 00
Örkelljunga;Skåne län;SWEREF 99 13 30
Örnsköldsvik;Västernorrlands län;SWEREF 99 18 45
Östersund;Jämtlands län;SWEREF 99 14 15
Österåker;Stockholms län;SWEREF 99 18 00
Östhammar;Uppsala län;SWEREF 99 18 00
Östra Göinge;Skåne län;SWEREF 99 13 30
Överkalix;Norrbottens län;SWEREF 99 23 15
Övertorneå;Norrbottens län;SWEREF 99 23 15`;

// Dynamically compile the municipalities list with smart positioning and staggering to avoid overlapping map pins.
export const MUNICIPALITIES: Municipality[] = (() => {
  const list: Municipality[] = [];
  const lines = RAW_MUNICIPALITIES_DATA.trim().split("\n");
  
  // Track how many items are registered per (County, Projection) to compute staggering
  const groupCounters: Record<string, number> = {};
  
  // 1st pass: count items in each group
  const groupSizes: Record<string, number> = {};
  lines.forEach(line => {
    const parts = line.split(";");
    if (parts.length < 3) return;
    const [_, county, projection] = parts;
    const key = `${county}_${projection}`;
    groupSizes[key] = (groupSizes[key] || 0) + 1;
  });

  // 2nd pass: create Municipality objects with staggering
  lines.forEach((line) => {
    const parts = line.split(";");
    if (parts.length < 3) return;
    
    const [name, county, projection] = parts;
    const projectionId = SWEREF_NAME_TO_ID[projection] || "sweref99_1500";
    
    // Position generation
    let lat = COUNTY_LATITUDES[county] || 59.0;
    let lon = SWEREF_NAME_TO_MERIDIAN[projection] || 15.0;
    
    const groupKey = `${county}_${projection}`;
    const size = groupSizes[groupKey] || 1;
    const currentIdx = groupCounters[groupKey] || 0;
    groupCounters[groupKey] = currentIdx + 1;
    
    if (MUNICIPALITY_OVERRIDES[name]) {
      // Use exact coordinates if overridden
      lat = MUNICIPALITY_OVERRIDES[name].lat;
      lon = MUNICIPALITY_OVERRIDES[name].lon;
    } else {
      // Stagger pins around the region to create a gorgeous organic cluster layout of the municipalities!
      // This spreads them in an elegant golden-ratio spiral
      if (size > 1) {
        const phi = currentIdx * 137.5 * (Math.PI / 180.0); // golden angle in radians
        // Radius increases with index, controlled and padded to fit nicely on the map
        const radius = 0.14 * Math.sqrt(currentIdx); 
        lat = lat + radius * Math.cos(phi) * 0.7; // narrow slightly vertically
        lon = lon + radius * Math.sin(phi);
      }
    }
    
    list.push({
      name,
      county,
      projection,
      projectionId,
      lat,
      lon
    });
  });
  
  return list;
})();
