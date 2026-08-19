import type { SupportedLanguage } from "@/lib/i18n/config";

const FEATURE_NAMES: Record<string, Record<SupportedLanguage, string>> = {
  segment_accidents_total_prior: {
    ru: "Аварий на участке (всего)",
    kk: "Учаскедегі апаттар (барлығы)",
    en: "Segment accidents (total)",
  },
  segment_accidents_prev_30d: {
    ru: "Аварий за 30 дней",
    kk: "30 күндегі апаттар",
    en: "Accidents in last 30 days",
  },
  segment_accidents_prev_90d: {
    ru: "Аварий за 90 дней",
    kk: "90 күндегі апаттар",
    en: "Accidents in last 90 days",
  },
  segment_accidents_prev_180d: {
    ru: "Аварий за 180 дней",
    kk: "180 күндегі апаттар",
    en: "Accidents in last 180 days",
  },
  segment_accidents_prev_365d: {
    ru: "Аварий за год",
    kk: "Жыл ішіндегі апаттар",
    en: "Accidents in last year",
  },
  road_length: {
    ru: "Протяжённость дороги",
    kk: "Жол ұзындығы",
    en: "Road length",
  },
  road_category: {
    ru: "Категория дороги",
    kk: "Жол санаты",
    en: "Road category",
  },
  road_highway: {
    ru: "Магистраль / шоссе",
    kk: "Магистраль / тасжол",
    en: "Highway / main road",
  },
  road_primary: {
    ru: "Основная дорога",
    kk: "Негізгі жол",
    en: "Primary road",
  },
  road_residential: {
    ru: "Жилая улица",
    kk: "Тұрғын үй көшесі",
    en: "Residential street",
  },
  road_service: {
    ru: "Второстепенная дорога",
    kk: "Көмекші жол",
    en: "Service road",
  },
  road_tertiary: {
    ru: "Третьестепенная дорога",
    kk: "Үшінші дәрежелі жол",
    en: "Tertiary road",
  },
  road_trunk: {
    ru: "Трасса / магистраль",
    kk: "Трасса / магистраль",
    en: "Trunk road",
  },
  road_unclassified: {
    ru: "Не классифицирована",
    kk: "Жіктелмеген",
    en: "Unclassified road",
  },
  segment_latitude: {
    ru: "Широта участка",
    kk: "Учаске ендігі",
    en: "Segment latitude",
  },
  segment_longitude: {
    ru: "Долгота участка",
    kk: "Учаске бойлығы",
    en: "Segment longitude",
  },
  segment_curve_angle: {
    ru: "Угол поворота",
    kk: "Бұрылу бұрышы",
    en: "Curve angle",
  },
  segment_speed_limit: {
    ru: "Ограничение скорости",
    kk: "Жылдамдық шегі",
    en: "Speed limit",
  },
  segment_lanes: {
    ru: "Количество полос",
    kk: "Жолақ саны",
    en: "Number of lanes",
  },
  segment_roadway_width: {
    ru: "Ширина проезжей части",
    kk: "Жүру бөлігінің ені",
    en: "Roadway width",
  },
  segment_shoulder_width: {
    ru: "Ширина обочины",
    kk: "Жол жиегінің ені",
    en: "Shoulder width",
  },
  segment_sidewalk_width: {
    ru: "Ширина тротуара",
    kk: "Тротуар ені",
    en: "Sidewalk width",
  },
  segment_lighting: {
    ru: "Освещение",
    kk: "Жарықтандыру",
    en: "Lighting",
  },
  segment_pavement_type: {
    ru: "Тип покрытия",
    kk: "Жабын түрі",
    en: "Pavement type",
  },
  segment_pavement_condition: {
    ru: "Состояние покрытия",
    kk: "Жабын күйі",
    en: "Pavement condition",
  },
  segment_intersection: {
    ru: "Перекрёсток",
    kk: "Қиылыс",
    en: "Intersection",
  },
  segment_crosswalk: {
    ru: "Пешеходный переход",
    kk: "Жаяу жүргіншілер өткелі",
    en: "Crosswalk",
  },
  segment_traffic_signals: {
    ru: "Светофор",
    kk: "Бағдаршам",
    en: "Traffic signals",
  },
  segment_traffic_calm: {
    ru: "Средства успокоения трафика",
    kk: "Трафикті тыныштандыру құралдары",
    en: "Traffic calming",
  },
  segment_bike_lane: {
    ru: "Велосипедная дорожка",
    kk: "Велосипед жолы",
    en: "Bike lane",
  },
  segment_bus_stop: {
    ru: "Автобусная остановка",
    kk: "Автобус аялдамасы",
    en: "Bus stop",
  },
  segment_school_zone: {
    ru: "Школьная зона",
    kk: "Мектеп аймағы",
    en: "School zone",
  },
  segment_hospital_nearby: {
    ru: "Больница рядом",
    kk: "Жақын жердегі аурухана",
    en: "Hospital nearby",
  },
  segment_railway_crossing: {
    ru: "Ж/д переезд",
    kk: "Теміржол өткелі",
    en: "Railway crossing",
  },
  segment_elevation: {
    ru: "Высота над уровнем моря",
    kk: "Теңіз деңгейінен биіктік",
    en: "Elevation",
  },
  segment_slope: {
    ru: "Уклон дороги",
    kk: "Жол еңісі",
    en: "Road slope",
  },
  city_accidents_total_prior: {
    ru: "Аварий в городе (всего)",
    kk: "Қаладағы апаттар (барлығы)",
    en: "City accidents (total)",
  },
  city_accidents_prev_30d: {
    ru: "Аварий в городе за 30 дней",
    kk: "30 күндегі қалалық апаттар",
    en: "City accidents in last 30 days",
  },
  city_population: {
    ru: "Население города",
    kk: "Қала халқы",
    en: "City population",
  },
  city_vehicle_count: {
    ru: "Количество ТС в городе",
    kk: "Қаладағы көлік саны",
    en: "City vehicle count",
  },
  weather_precipitation: {
    ru: "Осадки",
    kk: "Жауын-шашын",
    en: "Precipitation",
  },
  weather_temperature: {
    ru: "Температура",
    kk: "Температура",
    en: "Temperature",
  },
  weather_visibility: {
    ru: "Видимость",
    kk: "Көріну",
    en: "Visibility",
  },
  weather_wind_speed: {
    ru: "Скорость ветра",
    kk: "Жел жылдамдығы",
    en: "Wind speed",
  },
  time_of_day: {
    ru: "Время суток",
    kk: "Тәулік уақыты",
    en: "Time of day",
  },
  day_of_week: {
    ru: "День недели",
    kk: "Апта күні",
    en: "Day of week",
  },
  month: {
    ru: "Месяц",
    kk: "Ай",
    en: "Month",
  },
  season: {
    ru: "Сезон",
    kk: "Маусым",
    en: "Season",
  },
  is_holiday: {
    ru: "Праздничный день",
    kk: "Мереке күні",
    en: "Holiday",
  },
  is_weekend: {
    ru: "Выходной день",
    kk: "Демалыс күні",
    en: "Weekend",
  },
  daylight: {
    ru: "Светлое время суток",
    kk: "Жарық уақыт",
    en: "Daylight",
  },
  is_rush_hour: {
    ru: "Час пик",
    kk: "Сағат пик",
    en: "Rush hour",
  },
  road_oneway: {
    ru: "Одностороннее движение",
    kk: "Бір бағытты қозғалыс",
    en: "One-way road",
  },
  nearest_poi_500m: {
    ru: "Ближайшая точка интереса (500м)",
    kk: "Ең жақын қызығушылық нүктесі (500м)",
    en: "Nearest POI (500m)",
  },
  nearest_poi_1000m: {
    ru: "Ближайшая точка интереса (1км)",
    kk: "Ең жақын қызығушылық нүктесі (1км)",
    en: "Nearest POI (1km)",
  },
  nearest_transit_stop_500m: {
    ru: "Ближайшая остановка транспорта (500м)",
    kk: "Ең жақын көлік аялдамасы (500м)",
    en: "Nearest transit stop (500m)",
  },
  nearest_transit_stop_1000m: {
    ru: "Ближайшая остановка транспорта (1км)",
    kk: "Ең жақын көлік аялдамасы (1км)",
    en: "Nearest transit stop (1km)",
  },
  nearest_hospital_500m: {
    ru: "Ближайшая больница (500м)",
    kk: "Ең жақын аурухана (500м)",
    en: "Nearest hospital (500m)",
  },
  nearest_hospital_1000m: {
    ru: "Ближайшая больница (1км)",
    kk: "Ең жақын аурухана (1км)",
    en: "Nearest hospital (1km)",
  },
  nearest_school_500m: {
    ru: "Ближайшая школа (500м)",
    kk: "Ең жақын мектеп (500м)",
    en: "Nearest school (500m)",
  },
  nearest_school_1000m: {
    ru: "Ближайшая школа (1км)",
    kk: "Ең жақын мектеп (1км)",
    en: "Nearest school (1km)",
  },
  road_traffic_calming: {
    ru: "Лежачие полицейские",
    kk: "Жатып қалған полицейлер",
    en: "Traffic calming",
  },
  road_surface: {
    ru: "Покрытие дороги",
    kk: "Жол жабыны",
    en: "Road surface",
  },
  road_lanes: {
    ru: "Количество полос",
    kk: "Жолақ саны",
    en: "Road lanes",
  },
  road_speed_limit: {
    ru: "Ограничение скорости",
    kk: "Жылдамдық шегі",
    en: "Speed limit",
  },
  road_lit: {
    ru: "Освещение дороги",
    kk: "Жол жарығы",
    en: "Road lighting",
  },
  road_bicycle: {
    ru: "Велосипедная инфраструктура",
    kk: "Велосипед инфрақұрылымы",
    en: "Bicycle infrastructure",
  },
  road_foot: {
    ru: "Пешеходная инфраструктура",
    kk: "Жаяу жүргінші инфрақұрылымы",
    en: "Pedestrian infrastructure",
  },
  segment_historical_accidents: {
    ru: "Историческая аварийность",
    kk: "Тарихи апаттылық",
    en: "Historical accident rate",
  },
  segment_functional_class: {
    ru: "Функциональный класс дороги",
    kk: "Жолдың функционалдық класы",
    en: "Road functional class",
  },
  segment_width: {
    ru: "Ширина дороги",
    kk: "Жол ені",
    en: "Road width",
  },
  segment_curvature: {
    ru: "Извилистость дороги",
    kk: "Жолдың иілгіштігі",
    en: "Road curvature",
  },
};

function fallbackDisplayName(feature: string, lang: SupportedLanguage): string {
  if (lang === "en") {
    return feature
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return feature.replace(/_/g, " ");
}

export function getFeatureDisplayName(
  feature: string,
  lang: SupportedLanguage,
  backendDisplayName: Record<string, string> | null = null,
): string {
  const curated = FEATURE_NAMES[feature]?.[lang];
  if (curated) return curated;
  if (backendDisplayName?.[lang]) return backendDisplayName[lang];
  return fallbackDisplayName(feature, lang);
}
