/* ═══════════════════════════════════════════════════════════════════════
   COP17 page — language, calendar, speaker kit, hero motion
   ───────────────────────────────────────────────────────────────────────
   Self-contained on purpose: the site-wide localisation build is on hold
   (see i18n/README.md), and this one page needs English and Armenian now.

   Translation model: the English lives in the HTML. Each translatable
   element carries data-i="key" (text), data-i-alt or data-i-aria. The first
   time the script runs it records the English from the markup, so the
   dictionary below only has to hold Armenian — and JS-built strings.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var DATA = window.COP17_DATA;
  if (!DATA) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── strings ─────────────────────────────────────────────────────── */

  // English strings that only exist in JS (everything in the markup is read from it).
  var EN = {
    roleSpeaker: 'Speaker', roleModerator: 'Moderator', roleOrganiser: 'Organiser',
    roleFacilitator: 'Facilitator', roleAttending: 'Attending', roleCoordinator: 'Booth coordinator',
    roleProgramlead: 'Program lead', rolePanelist: 'Panelist', roleParticipant: 'Participant', roleCohost: 'Co-host',
    boothHours: 'Booth hours', confDay: 'COP17 day',
    boothAvail: 'Booth hours do not block my calendar. I am open to speaking requests, so just ask.',
    dtTime: 'Time', dtWhere: 'Where', dtOrg: 'Organiser', dtZone: 'Zone', dtRole: 'My role',
    tbc: 'To be confirmed', tbcTime: 'Time to be confirmed', tbcDate: 'Date to be confirmed',
    allDay: 'All day', addCal: 'Add to my calendar', official: 'Official page',
    boothTitle: 'Armenia Tree Project (ATP) booth',
    emptyDay: 'Nothing public listed for this day. Try a highlighted date.',
    emptyFilter: 'Nothing for this zone on this day. Try another filter or date.',
    dayCount1: '1 engagement', dayCountN: '{n} engagements', dayCount0: 'No engagements listed',
    confDay: 'COP17 · day {n} of 12', preDay: 'Before COP17', inDay: 'During COP17',
    stBefore: '{n} days until COP17', stBefore1: '1 day until COP17', stLive: 'COP17 is on · day {n} of 12',
    stAfter: 'COP17 took place 19–30 October 2026',
    copied: 'Copied', zoneBlue: 'Blue Zone', zoneGreen: 'Green Zone', zoneOther: 'Other venue',
    bookSubject: 'Speaking at COP17 Yerevan',
    dow: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    dowLong: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    monthGen: 'October'
  };

  var HY = {
    skip: 'Անցնել բովանդակությանը',
    navHome: 'COP17 Երևան × Նարեկ Օհանյան — գլխավոր էջ',
    nHome: 'Գլխավոր', nAbout: 'Իմ մասին', nMedia: 'Մեդիա և նորություններ', nNewsroom: 'Նորություններ', nBlog: 'Բլոգ', nContact: 'Կապ',
    langLabel: 'Լեզու',
    heroEyebrow: 'ՄԱԿ Կենսաբազմազանության համաժողով · CBD COP17',
    heroWhen: 'Երևան, Հայաստան · 2026 թ. հոկտեմբերի 19–30',
    heroH1a: 'Գործելով', heroH1b: 'հանուն բնության,', heroH1c: 'տանը։',
    heroLede: 'Ես Նարեկ Օհանյանն եմ։ COP17-ում ես UNICEF-ի գլոբալ պատվիրակության և ՀԱՀ Յակոբեան բնապահպանական կենտրոնի պատվիրակության անդամ եմ և համակարգում եմ Կապույտ գոտու Armenia Tree Project-ի տաղավարը։ Այս էջում կարող եք տեսնել, թե որ օրը որտեղ եմ, և ինչպես հրավիրել ինձ։',
    ctaCal: 'Որտեղ կլինեմ', ctaBook: 'Հրավիրել ելույթի', ctaKit: 'Խոսնակի փաթեթ',
    heroAlt: 'Նարեկ Օհանյանը՝ կռթնած ծառի բնին, նկարը կտրված է COP17-ի թիթեռի տեսքով',
    aboutKicker: 'Պարզ բառերով',
    aboutH: 'Ի՞նչ է COP17-ը, և ի՞նչ եմ անելու այնտեղ',
    whatH: 'Ի՞նչ է սա',
    whatP: 'COP17-ը ՄԱԿ-ի Կենսաբազմազանության համաժողովն է՝ 17-րդը։ 2026 թվականի հոկտեմբերի 19–30-ը գրեթե բոլոր երկրները հավաքվում են Երևանում՝ պայմանավորվելու, թե ինչպես կանգնեցնել բնության կորուստը և վերականգնել այն։ Հայաստանը հյուրընկալող երկիրն է։',
    zonesH: 'Երկու գոտի',
    zBlue: 'Կապույտ գոտի', zBlueP: 'պաշտոնական քննարկումներ և միջոցառումներ՝ գրանցված մասնակիցների համար։',
    zGreen: 'Կանաչ գոտի', zGreenP: 'բաց է հանրության համար. ցուցահանդեսներ, ելույթներ և կողմնակի միջոցառումներ։',
    rolesH: 'Իմ դերերը COP17-ում',
    r1Tag: 'UNICEF', r1H: 'UNICEF-ի գլոբալ պատվիրակության անդամ',
    r1P: 'Ես ներկայացնում եմ UNICEF-ի պատվիրակությունը Կապույտ գոտու բարձր մակարդակի միջոցառումներում։ Իմ ուշադրության կենտրոնում են՝',
    r1a: 'երեխաների և երիտասարդների ներառումը որոշումների կայացման մեջ։',
    r1b: 'կենսաբազմազանության պաշտպանությունը երեխաների և երիտասարդների տեսանկյունից՝ CBD-ի բանակցություններում։',
    r2Tag: 'ՀԱՀ', r2H: 'ՀԱՀ Յակոբեան բնապահպանական կենտրոնի պատվիրակություն',
    r2P: 'Ես ՀԱՀ Յակոբեան բնապահպանական կենտրոնի պատվիրակության մաս եմ և մասնակցում եմ համաժողովի տարբեր միջոցառումների՝',
    r2a: 'նիստեր Հայաստանի անտառների և կլիմայական ծառայությունների մասին։',
    r2b: 'Կենսաբազմազանության դեսպանների եզրափակիչ արարողություն՝ բուհերի կոալիցիայի հետ։',
    r3Tag: 'Armenia Tree Project', r3H: 'Կապույտ գոտու տաղավարի համակարգող',
    r3P: 'Ես համակարգում եմ Armenia Tree Project-ի (ATP) մշտական տաղավարը՝ Հայաստանի անտառների և բնության ներկայացուցչությունը։ Իմ խնդիրներն են՝',
    role1: 'ողջունել պատվիրակություններին, դոնորներին և քաղաքականություն մշակողներին և ներկայացնել ATP-ի անտառվերականգնման և բնության վրա հիմնված լուծումների ծրագրերը։',
    role2: 'լսել, թե ինչն է հետաքրքրում այցելուներին, և կապել նրանց ճիշտ փորձագետի կամ ATP-ի ղեկավարության հետ։',
    role3: 'վարել տաղավարի պլանավորված միջոցառումները, ներկայացումները և պատվիրակությունների շրջայցերը։',
    calKicker: 'Ինտերակտիվ օրացույց', calH: 'Որտեղ ինձ գտնել',
    availH: 'Բաց եմ ելույթների համար',
    availP: 'ATP-ի տաղավարի վարումը չի արգելափակում իմ օրացույցը։ COP17-ի ողջ ընթացքում հասանելի եմ ելույթների և խորհրդատվության առաջարկների համար։',
    calSub: 'Ընտրեք օր՝ տեսնելու, թե ինչ եմ անելու, որտեղ է դա, ով է կազմակերպիչը և որ գոտում է։ Զտիչներով կարող եք տեսնել միայն մեկ գոտին։',
    filterLabel: 'Զտել ըստ գոտու', fAll: 'Բոլորը', zOther: 'Երիտասարդական ֆորում և այլ վայրեր', zOtherShort: 'Այլ վայր',
    monthName: 'Հոկտեմբեր 2026', monthHint: 'COP17՝ հոկտեմբերի 19–30',
    newsKicker: 'Օրական՝ համաժողովից', newsH: 'Հետևեք COP17-ին օր առ օր',
    newsP: 'Երկու տեղ՝ համաժողովի ընթացքում թարմ մնալու համար. արագ նորություններ՝ ինչպես տեղի են ունենում, և հանգիստ ամփոփում ամեն օրվա վերջում։',
    newsC1H: 'Օրվա նորություններ', newsC1P: 'Կարճ թարմացումներ համաժողովից՝ ինչպես տեղի են ունենում։',
    newsC1a: 'Որտեղ եմ և ինչով եմ զբաղված', newsC1b: 'Ում հետ եմ հանդիպել և ինչ է հայտարարվել', newsC1Cta: 'Անցնել Newsroom-ին',
    newsC2H: 'Օրվա ամփոփում', newsC2P: 'Մեկ կարճ պատմություն ամեն օրվա վերջում՝ առօրյա լեզվով։',
    newsC2a: 'Ինչ եղավ և օրվա կարևոր պահերը', newsC2b: 'Ինչ կարող է դա նշանակել Հայաստանի մարդկանց համար', newsC2Cta: 'Կարդալ բլոգը',
    filmKicker: 'Դիտել',
    filmPlay: 'Նվագարկել տեսանյութը՝ «People Taking Action for Nature: The Journey to COP17»',
    filmP: 'Կարճ վավերագրական ֆիլմ Արարատի էկո-ակումբից մինչև համաշխարհային բեմ ճանապարհիս մասին, նկարահանված COP17-ից առաջ։ Ինձ ճանաչելու ամենաարագ ձևն է։',
    filmYt: 'Դիտել YouTube-ում', filmMore: 'Այլ հարցազրույցներ և հեռարձակումներ',
    bookKicker: 'Ելույթներ և մամուլ',
    bookH: 'Ուզո՞ւմ եք ինձ ձեր բեմում, քննարկման կամ ծրագրում',
    bookP: 'Գրեք ամսաթիվը, լսարանը և ձևաչափը։ Ձևաթուղթը բացվում է արդեն լրացված՝ COP17-ի համար, այնպես որ մեկ րոպե է պահանջվում։ Հասանելի եմ COP17-ի ողջ ընթացքում, նաև տաղավարի օրերին։',
    footNote: 'Սա Նարեկ Օհանյանի անձնական էջն է։ Այն ոչ COP17-ի, ոչ CBD-ի պաշտոնական կայք չէ։ Միջոցառումների տվյալները վերցված են հրապարակված ծրագրերից և կարող են փոխվել. խնդրում ենք օրվա ընթացքում ստուգել պաշտոնական ժամանակացույցը։',
    kitH: 'Խոսնակի փաթեթ', close: 'Փակել',
    kitLede: 'Այն ամենը, ինչ պետք է ինձ հետ նիստը գովազդելու կամ իմ մասին գրելու համար։',
    kitPhotos: 'Լուսանկարներ',
    photoAlt1: 'Նարեկ Օհանյանի դիմանկարը՝ COP17-ի թիթեռի տեսքով կտրված',
    photoAlt2: 'Նարեկ Օհանյանի դիմանկարը',
    photo1: 'Նկար՝ COP17-ի թիթեռի տեսքով (թափանցիկ PNG)', photo2: 'Ստանդարտ դիմանկար (JPG)',
    download: 'Ներբեռնել', copy: 'Պատճենել',
    kitBio: 'Կարճ կենսագրություն', kitOne: 'Մեկ տողանոց կենսագրություն', kitTopics: 'Թեմաներ, որոնց մասին խոսում եմ',
    topic1: 'Երիտասարդները կենսաբազմազանության և կլիմայի քաղաքականության մեջ',
    topic2: 'Կլիմայակայուն անտառներ և որտեղ տնկել',
    topic3: 'Բնության համար աշխատող մասնագիտություններ նոր սերնդի համար',
    topic4: 'Կլիմայի գիտությունը՝ գործողության դարձնելը հեշտ',
    kitFull: 'Պահանջել լրիվ մամուլի փաթեթը',

    roleSpeaker: 'Բանախոս', roleModerator: 'Մոդերատոր', roleOrganiser: 'Կազմակերպիչ',
    roleFacilitator: 'Ֆասիլիտատոր', roleAttending: 'Մասնակից', roleCoordinator: 'Տաղավարի համակարգող',
    roleProgramlead: 'Ծրագրի ղեկավար', rolePanelist: 'Քննարկման մասնակից', roleParticipant: 'Մասնակից', roleCohost: 'Համահյուրընկալող',
    boothHours: 'Տաղավարի ժամերը',
    boothAvail: 'Տաղավարի ժամերը չեն արգելափակում իմ օրացույցը։ Բաց եմ ելույթի առաջարկների համար, պարզապես գրեք։',
    dtTime: 'Ժամ', dtWhere: 'Որտեղ', dtOrg: 'Կազմակերպիչ', dtZone: 'Գոտի', dtRole: 'Իմ դերը',
    tbc: 'Կճշտվի', tbcTime: 'Ժամը կճշտվի', tbcDate: 'Ամսաթիվը կճշտվի',
    allDay: 'Ամբողջ օրը', addCal: 'Ավելացնել իմ օրացույցում', official: 'Պաշտոնական էջ',
    boothTitle: 'Armenia Tree Project (ATP) տաղավար',
    emptyDay: 'Այս օրվա համար հրապարակային միջոցառում նշված չէ։ Փորձեք նշված օրերից որևէ մեկը։',
    emptyFilter: 'Այս օրը այս գոտու համար ոչինչ չկա։ Փորձեք այլ զտիչ կամ օր։',
    dayCount1: '1 միջոցառում', dayCountN: '{n} միջոցառում', dayCount0: 'Միջոցառում նշված չէ',
    confDay: 'COP17 · 12 օրից {n}-րդը', preDay: 'COP17-ից առաջ', inDay: 'COP17-ի ընթացքում',
    stBefore: 'COP17-ին մնաց {n} օր', stBefore1: 'COP17-ին մնաց 1 օր', stLive: 'COP17-ը ընթացքի մեջ է · 12 օրից {n}-րդը',
    stAfter: 'COP17-ը տեղի ունեցավ 2026 թ. հոկտեմբերի 19–30-ին',
    copied: 'Պատճենվեց', zoneBlue: 'Կապույտ գոտի', zoneGreen: 'Կանաչ գոտի', zoneOther: 'Այլ վայր',
    bookSubject: 'Ելույթ COP17-ում, Երևան',
    dow: ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր'],
    dowLong: ['Երկուշաբթի', 'Երեքշաբթի', 'Չորեքշաբթի', 'Հինգշաբթի', 'Ուրբաթ', 'Շաբաթ', 'Կիրակի'],
    monthGen: 'հոկտեմբերի'
  };

  var BIO = {
    en: {
      short: 'Narek Ohanyan is a young climate leader from Armenia. He is a climate & environmental researcher at the AUA Acopian Center for the Environment. He has also served as a Guest Scientist at the Swiss Federal Institute for Forest, Snow and Landscape Research WSL. His current research focuses on modeling forest climate resilience. Focusing on climate analytics and resilience, he authored the book The Overshoot: Life After the 1.5°C Limit. Across 10 years of dedication and activism, he has managed 50+ projects and secured tens of thousands of dollars in grants, empowering 10k+ Youth for Climate Action. Nationally, Narek serves as the Lead Organizer for LCOY Armenia (2025-2026). He advises the Ministry of Environment and UNICEF through the Youth Climate Council, and previously served as a UNFCCC COP27 Party Delegate and UN Youth and Children High-Level Climate Champion. Narek holds a BS in Computer Science (’26) from the American University of Armenia. He is an incoming MS in Climate Science candidate at Columbia University in the City of New York, USA.\n\nAt CBD COP17, Narek is representing the UNICEF Global Delegation and serving as the Blue Zone Booth Coordinator for the Armenia Tree Project, alongside his ongoing initiatives with the AUA Acopian Center and the Armenian University Coalition for Biodiversity.',
      one: 'Young climate leader from Armenia; climate & environmental researcher at the AUA Acopian Center for the Environment.'
    },
    hy: {
      short: 'Նարեկ Օհանյանը երիտասարդ կլիմայական առաջնորդ է Հայաստանից։ Նա կլիմայի և շրջակա միջավայրի հետազոտող է ՀԱՀ Յակոբեան բնապահպանական կենտրոնում։ Նա նաև եղել է հյուր գիտնական Շվեյցարիայի անտառների, ձյան և լանդշաֆտի հետազոտության դաշնային ինստիտուտում՝ WSL-ում։ Նրա ներկայիս հետազոտությունը կենտրոնացած է անտառների կլիմայակայունության մոդելավորման վրա։ Կլիմայական վերլուծության և կայունության հարցերով զբաղվելով՝ նա հեղինակել է «The Overshoot: Life After the 1.5°C Limit» գիրքը։ 10 տարվա նվիրումի և ակտիվիզմի ընթացքում նա ղեկավարել է ավելի քան 50 ծրագիր, ապահովել է տասնյակ հազարավոր դոլարների դրամաշնորհներ և հզորացրել է 10 հազարից ավելի երիտասարդների՝ հանուն կլիմայական գործողության։ Ազգային մակարդակում Նարեկը LCOY Հայաստանի (2025–2026) գլխավոր կազմակերպիչն է։ Նա խորհրդատվություն է տրամադրում Շրջակա միջավայրի նախարարությանը և UNICEF-ին Երիտասարդական կլիմայական խորհրդի միջոցով, իսկ նախկինում եղել է UNFCCC COP27-ի կողմի պատվիրակ և ՄԱԿ-ի երիտասարդների և երեխաների բարձր մակարդակի կլիմայական չեմպիոն։ Նարեկն ունի համակարգչային գիտության բակալավրի աստիճան (’26) Հայաստանի ամերիկյան համալսարանից։ Նա Նյու Յորքի Կոլումբիայի համալսարանում կլիմայի գիտության մագիստրոսի ապագա ուսանող է։\n\nCBD COP17-ում Նարեկը ներկայացնում է UNICEF-ի գլոբալ պատվիրակությունը և Armenia Tree Project-ի Կապույտ գոտու տաղավարի համակարգողն է՝ ՀԱՀ Յակոբեան բնապահպանական կենտրոնի և Կենսաբազմազանության հարցերով հայկական բուհերի կոալիցիայի շարունակական նախաձեռնությունների հետ մեկտեղ։',
      one: 'Երիտասարդ կլիմայական առաջնորդ Հայաստանից. կլիմայի և շրջակա միջավայրի հետազոտող ՀԱՀ Յակոբեան բնապահպանական կենտրոնում։'
    }
  };

  var lang = 'en';
  var zone = 'all';
  var selected = null;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* English is recorded once from the markup. */
  $$('[data-i]').forEach(function (el) { if (!(el.getAttribute('data-i') in EN)) EN[el.getAttribute('data-i')] = el.innerHTML; });
  $$('[data-i-alt]').forEach(function (el) { EN[el.getAttribute('data-i-alt')] = el.getAttribute('alt'); });
  $$('[data-i-aria]').forEach(function (el) { EN[el.getAttribute('data-i-aria')] = el.getAttribute('aria-label'); });

  function t(key, vars) {
    var s = (lang === 'hy' && HY[key] !== undefined) ? HY[key] : EN[key];
    if (typeof s === 'string' && vars) {
      Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    }
    return s;
  }
  function L(obj) { return obj ? (obj[lang] || obj.en) : null; }

  /* ── dates ───────────────────────────────────────────────────────── */
  function parts(iso) { var p = iso.split('-'); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function dowIndex(iso) {                       // Monday = 0
    var p = parts(iso);
    return (new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() + 6) % 7;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoOf(day) { return '2026-10-' + pad(day); }
  function dayLabel(iso) {
    var p = parts(iso);
    return lang === 'hy' ? (p.d + ' ' + HY.monthGen) : (p.d + ' ' + EN.monthGen);
  }
  function today() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yerevan' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function confDayNumber(iso) {
    if (iso < DATA.conference.start || iso > DATA.conference.end) return 0;
    return parts(iso).d - parts(DATA.conference.start).d + 1;
  }

  /* ── data for a day ──────────────────────────────────────────────── */
  function zoneOk(z) { return zone === 'all' || zone === z; }

  function eventsOn(iso) {
    var list = DATA.events.filter(function (e) { return e.date === iso && zoneOk(e.zone); });
    list.sort(function (a, b) { return (a.start || '99:99') < (b.start || '99:99') ? -1 : 1; });
    return list;
  }
  function boothOn(iso) {
    return !!DATA.booth.slots[iso] && zoneOk(DATA.booth.zone);
  }

  /* ── language ────────────────────────────────────────────────────── */
  function setLang(next, persist) {
    lang = next === 'hy' ? 'hy' : 'en';
    document.documentElement.lang = lang;
    $$('[data-i]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i')); });
    $$('[data-i-alt]').forEach(function (el) { el.setAttribute('alt', t(el.getAttribute('data-i-alt'))); });
    $$('[data-i-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i-aria'))); });
    $$('.c17-lang__b').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });

    document.title = lang === 'hy' ? 'COP17 Երևան — Նարեկ Օհանյան' : 'COP17 Yerevan — Narek Ohanyan';
    var logo = $('[data-logo]');
    if (logo) logo.src = '../Media/web/cop17/logo-' + (lang === 'hy' ? 'hy' : 'en') + '-white.png';

    renderBio();
    renderCalendar();
    renderDay();
    renderStatus();
    wireBookLinks();
    if (persist) { try { localStorage.setItem('c17.lang', lang); } catch (e) {} }
  }

  $$('.c17-lang__b').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });

  /* ── status line ─────────────────────────────────────────────────── */
  function renderStatus() {
    var now = today(), el = $('#c17StatusText'), box = $('#c17Status');
    if (!el) return;
    var s, state;
    if (now < DATA.conference.start) {
      var a = parts(now), b = parts(DATA.conference.start);
      var n = Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 864e5);
      s = n === 1 ? t('stBefore1') : t('stBefore', { n: n }); state = 'before';
    } else if (now <= DATA.conference.end) {
      s = t('stLive', { n: confDayNumber(now) }); state = 'live';
    } else { s = t('stAfter'); state = 'after'; }
    el.textContent = s;
    box.setAttribute('data-state', state);
  }

  /* ── calendar ────────────────────────────────────────────────────── */
  function renderCalendar() {
    var dow = $('#c17Dow'), grid = $('#c17Days');
    dow.innerHTML = '';
    t('dow').forEach(function (d) { var s = document.createElement('span'); s.textContent = d; dow.appendChild(s); });

    var keepFocus = document.activeElement && grid.contains(document.activeElement)
      ? document.activeElement.getAttribute('data-iso') : null;
    grid.innerHTML = '';

    var lead = dowIndex('2026-10-01');
    for (var i = 0; i < lead; i++) { var g = document.createElement('span'); g.className = 'c17-d c17-d--ghost'; g.setAttribute('aria-hidden', 'true'); grid.appendChild(g); }

    var now = today();
    for (var day = 1; day <= 31; day++) {
      var iso = isoOf(day);
      var evs = eventsOn(iso);
      var booth = boothOn(iso);
      var inConf = confDayNumber(iso) > 0;
      var total = evs.length;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'c17-d' + (inConf ? ' is-conf' : '') + (total ? ' has-ev' : '') + (iso === now ? ' is-today' : '') + (iso === selected ? ' is-sel' : '');
      b.setAttribute('data-iso', iso);
      b.setAttribute('aria-pressed', iso === selected ? 'true' : 'false');
      b.setAttribute('aria-label', t('dowLong')[dowIndex(iso)] + ' ' + dayLabel(iso) + ', ' + (inConf ? t('confDay') + ', ' : '') + countText(total + (booth ? 1 : 0)));
      b.tabIndex = (iso === (selected || '')) ? 0 : -1;

      var num = document.createElement('span');
      num.className = 'c17-d__n'; num.textContent = day;
      b.appendChild(num);

      if (total) {
        var dots = document.createElement('span');
        dots.className = 'c17-d__dots'; dots.setAttribute('aria-hidden', 'true');
        evs.slice(0, 4).forEach(function (e) { var i2 = document.createElement('i'); i2.className = 'kdot kdot--' + e.zone; dots.appendChild(i2); });
        b.appendChild(dots);
      }
      grid.appendChild(b);
    }
    if (keepFocus) { var f = $('[data-iso="' + keepFocus + '"]', grid); if (f) f.focus({ preventScroll: true }); }
  }

  function countText(n) {
    return n === 0 ? t('dayCount0') : n === 1 ? t('dayCount1') : t('dayCountN', { n: n });
  }

  function select(iso, focusPanel) {
    selected = iso;
    $$('.c17-d[data-iso]').forEach(function (b) {
      var on = b.getAttribute('data-iso') === iso;
      b.classList.toggle('is-sel', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    renderDay();
    if (focusPanel && window.matchMedia('(max-width: 900px)').matches) {
      $('#c17Day').scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    }
  }

  $('#c17Days').addEventListener('click', function (e) {
    var b = e.target.closest('.c17-d[data-iso]');
    if (b) select(b.getAttribute('data-iso'), true);
  });

  $('#c17Days').addEventListener('keydown', function (e) {
    var b = e.target.closest('.c17-d[data-iso]');
    if (!b) return;
    var delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!delta) return;
    var n = parts(b.getAttribute('data-iso')).d + delta;
    if (n < 1 || n > 31) return;
    e.preventDefault();
    var next = $('[data-iso="' + isoOf(n) + '"]');
    if (next) { $$('.c17-d[data-iso]').forEach(function (x) { x.tabIndex = -1; }); next.tabIndex = 0; next.focus(); }
  });

  $('#c17Filters').addEventListener('click', function (e) {
    var c = e.target.closest('.c17-chip');
    if (!c) return;
    zone = c.getAttribute('data-zone');
    $$('.c17-chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
    renderCalendar();
    renderDay();
  });

  /* ── the day panel ───────────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function iconUse(id) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ico'); s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id);
    s.appendChild(u); return s;
  }
  function zoneName(z) { return t(z === 'blue' ? 'zoneBlue' : z === 'green' ? 'zoneGreen' : 'zoneOther'); }
  function roleName(r) {
    return t({ speaker: 'roleSpeaker', moderator: 'roleModerator', organiser: 'roleOrganiser',
               facilitator: 'roleFacilitator', attending: 'roleAttending', coordinator: 'roleCoordinator',
               programlead: 'roleProgramlead', panelist: 'rolePanelist', participant: 'roleParticipant',
               cohost: 'roleCohost' }[r]);
  }
  function timeText(e) {
    if (!e.start) return t('tbcTime');
    return e.start + (e.end ? '–' + e.end : '');
  }

  function row(label, icon, valueNode) {
    var r = el('div', 'c17-f');
    var k = el('dt', 'c17-f__k'); k.appendChild(iconUse(icon)); k.appendChild(el('span', null, label));
    var v = el('dd', 'c17-f__v'); v.appendChild(valueNode);
    r.appendChild(k); r.appendChild(v);
    return r;
  }
  function valueOrTbc(txt) {
    return txt ? document.createTextNode(txt) : el('span', 'c17-tbc', t('tbc'));
  }

  function card(item, isBooth) {
    var z = isBooth ? DATA.booth.zone : item.zone;
    var c = el('article', 'c17-ev c17-ev--' + z);

    var head = el('div', 'c17-ev__head');
    head.appendChild(el('span', 'c17-badge c17-badge--' + z, zoneName(z)));
    head.appendChild(el('span', 'c17-role', isBooth ? roleName('cohost') : (item.roleText ? L(item.roleText) : roleName(item.role))));
    c.appendChild(head);

    c.appendChild(el('h4', 'c17-ev__title', isBooth ? t('boothTitle') : L(item.title)));
    var tbc = (item.tbc || []);
    if (!isBooth && tbc.indexOf('date') !== -1) c.appendChild(el('p', 'c17-tbc c17-tbc--block', t('tbcDate')));

    c.appendChild(el('p', 'c17-ev__plain', L(item.plain)));

    var dl = el('dl', 'c17-fs');
    var timeNode;
    if (isBooth) {
      timeNode = document.createTextNode((DATA.booth.slots[selected] || []).map(function (sl) { return sl[0] + '–' + sl[1]; }).join('  ·  '));
    } else {
      timeNode = el('span', null, timeText(item));
      if (item.start && tbc.indexOf('time') !== -1) { timeNode.appendChild(document.createTextNode(' ')); timeNode.appendChild(el('span', 'c17-tbc', t('tbc'))); }
      if (!item.start) timeNode = el('span', 'c17-tbc', t('tbcTime'));
    }
    dl.appendChild(row(isBooth ? t('boothHours') : t('dtTime'), 'c-clock', timeNode));
    dl.appendChild(row(t('dtWhere'), 'c-pin', valueOrTbc(L(item.place))));
    dl.appendChild(row(t('dtOrg'), 'c-org', valueOrTbc(L(item.org))));
    c.appendChild(dl);

    if (isBooth) {
      var av = el('p', 'c17-ev__avail');
      av.appendChild(document.createTextNode(t('boothAvail') + ' '));
      var ba = el('a', 'c17-link'); ba.href = '../contact.html?topic=cop17&lang=' + lang + '#write';
      ba.appendChild(iconUse('c-mic')); ba.appendChild(el('span', null, t('ctaBook')));
      av.appendChild(ba);
      c.appendChild(av);
    }

    var acts = el('div', 'c17-ev__acts');
    if (!isBooth && item.start) {
      var b = el('button', 'c17-link'); b.type = 'button';
      b.appendChild(iconUse('c-cal')); b.appendChild(el('span', null, t('addCal')));
      b.addEventListener('click', function () { downloadIcs(item); });
      acts.appendChild(b);
    }
    if (!isBooth && item.link) {
      var a = el('a', 'c17-link'); a.href = item.link; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.appendChild(iconUse('c-arrow')); a.appendChild(el('span', null, t('official')));
      acts.appendChild(a);
    }
    if (acts.children.length) c.appendChild(acts);
    return c;
  }

  function renderDay() {
    var box = $('#c17DayList');
    if (!selected) return;
    var evs = eventsOn(selected), booth = boothOn(selected);
    var n = confDayNumber(selected);
    $('#c17DayEyebrow').textContent = n ? t('confDay', { n: n }) : (selected < DATA.conference.start ? t('preDay') : t('inDay'));
    $('#c17DayH').textContent = t('dowLong')[dowIndex(selected)] + ', ' + dayLabel(selected);

    box.innerHTML = '';
    evs.forEach(function (e) { box.appendChild(card(e, false)); });
    if (booth) box.appendChild(card(DATA.booth, true));
    if (!box.children.length) {
      var anyThatDay = DATA.events.some(function (e) { return e.date === selected; }) || !!DATA.booth.slots[selected];
      box.appendChild(el('p', 'c17-empty', t(anyThatDay ? 'emptyFilter' : 'emptyDay')));
    }
  }

  /* ── add to calendar (.ics) ──────────────────────────────────────── */
  function utc(iso, hm) {
    var p = parts(iso), h = hm.split(':');
    var d = new Date(Date.UTC(p.y, p.m - 1, p.d, +h[0] - 4, +h[1]));   // Yerevan is UTC+4
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
  }
  function esc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
  function downloadIcs(e) {
    var end = e.end || e.start;
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//narekohanyan.com//COP17//EN', 'BEGIN:VEVENT',
      'UID:' + e.id + '@cop17.narekohanyan.com', 'DTSTAMP:' + utc(today(), '00:00'),
      'DTSTART:' + utc(e.date, e.start), 'DTEND:' + utc(e.date, end),
      'SUMMARY:' + esc(e.title.en), 'LOCATION:' + esc((e.place && e.place.en) || 'COP17, Yerevan'),
      'DESCRIPTION:' + esc((e.plain && e.plain.en) + (e.org ? ' Organiser: ' + e.org.en + '.' : '') + ' Times may change; check the official schedule.'),
      'END:VEVENT', 'END:VCALENDAR'];
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'cop17-' + e.id + '.ics';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  /* ── speaker kit ─────────────────────────────────────────────────── */
  var dlg = $('#c17Kit');

  function renderBio() {
    $$('[data-bio]').forEach(function (p) {
      var which = p.getAttribute('data-bio').split('-');       // short-en
      p.textContent = BIO[which[1]][which[0]];
    });
  }

  $$('[data-kit-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      document.documentElement.classList.add('c17-lock');
    });
  });
  function closeKit() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  dlg.addEventListener('close', function () { document.documentElement.classList.remove('c17-lock'); });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.closest('[data-kit-close]')) closeKit();
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var txt = $(btn.getAttribute('data-copy')).textContent;
    var done = function () {
      var lab = $('[data-copy-label]', btn);
      lab.textContent = t('copied'); btn.classList.add('is-done');
      setTimeout(function () { lab.textContent = t('copy'); btn.classList.remove('is-done'); }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function () { legacyCopy(txt); done(); });
    } else { legacyCopy(txt); done(); }
  });
  function legacyCopy(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  /* ── booking links carry the page language ───────────────────────── */
  function wireBookLinks() {
    $$('a[href*="contact.html?topic="]').forEach(function (a) {
      var u = a.getAttribute('href').replace(/&lang=\w+/, '');
      a.setAttribute('href', u.replace('#write', '&lang=' + lang + '#write'));
    });
  }

  /* ── featured film facade (same behaviour as the Media page) ─────── */
  $$('img[data-fallback]').forEach(function (img) {
    function swap() { img.src = 'https://i.ytimg.com/vi/' + img.getAttribute('data-fallback') + '/hqdefault.jpg'; img.removeAttribute('data-fallback'); }
    img.addEventListener('error', swap);
    img.addEventListener('load', function () { if (img.naturalWidth <= 120 && img.getAttribute('data-fallback')) swap(); });
  });
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-yt]');
    if (!btn) return;
    var served = /^https?:$/.test(location.protocol);
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube.com/embed/' + btn.getAttribute('data-yt') + '?autoplay=1&rel=0&modestbranding=1&playsinline=1' +
            (served ? '&origin=' + encodeURIComponent(location.origin) : '');
    f.title = btn.getAttribute('aria-label') || 'Video player';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen = true; f.className = btn.className + ' is-live'; f.setAttribute('frameborder', '0');
    btn.replaceWith(f); f.focus();
  });

  /* ── hero motion ─────────────────────────────────────────────────── */
  var hero = $('.c17-hero'), portrait = $('#c17Portrait');
  if (hero && !still && fine) {
    var raf = 0, tx = 0, ty = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        hero.style.setProperty('--px', tx.toFixed(3));
        hero.style.setProperty('--py', ty.toFixed(3));
      });
    });
    hero.addEventListener('pointerleave', function () { hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0); });
  }

  // Click or tap empty hero space to release a butterfly.
  if (hero && !still) {
    hero.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      var r = hero.getBoundingClientRect();
      var b = document.createElement('img');
      b.src = '../Media/web/cop17/butterfly.png'; b.alt = ''; b.className = 'c17-spawn'; b.setAttribute('aria-hidden', 'true');
      b.style.left = (e.clientX - r.left) + 'px'; b.style.top = (e.clientY - r.top) + 'px';
      b.style.setProperty('--dx', (Math.random() * 160 - 40).toFixed(0) + 'px');
      b.style.setProperty('--rot', (Math.random() * 50 - 25).toFixed(0) + 'deg');
      hero.appendChild(b);
      b.addEventListener('animationend', function () { b.remove(); });
    });
  }

  // Butterflies also drift up on their own, every few seconds, while the hero is on
  // screen and the tab is visible — no click needed.
  if (hero && !still && 'IntersectionObserver' in window) {
    var inView = true, autoTimer = 0;
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.15 }).observe(hero);

    // A flock every couple of seconds (4-8 at once, a few hundred ms apart),
    // never more than 18 in the air together.
    var one = function () {
      if (!inView || document.visibilityState !== 'visible') return;
      if (hero.querySelectorAll('.c17-spawn').length >= 18) return;
      var r = hero.getBoundingClientRect();
      var b = document.createElement('img');
      b.src = '../Media/web/cop17/butterfly.png'; b.alt = ''; b.className = 'c17-spawn'; b.setAttribute('aria-hidden', 'true');
      b.style.left = (r.width * (0.05 + Math.random() * 0.9)).toFixed(0) + 'px';
      b.style.top  = (r.height * (0.55 + Math.random() * 0.4)).toFixed(0) + 'px';
      b.style.width = (1.6 + Math.random() * 1.6).toFixed(2) + 'rem';
      b.style.setProperty('--dx', (Math.random() * 220 - 80).toFixed(0) + 'px');
      b.style.setProperty('--rot', (Math.random() * 60 - 30).toFixed(0) + 'deg');
      hero.appendChild(b);
      b.addEventListener('animationend', function () { b.remove(); });
    };
    var releaseAuto = function () {
      autoTimer = window.setTimeout(releaseAuto, 1500 + Math.random() * 1500);
      var n = 4 + Math.floor(Math.random() * 5);
      for (var i = 0; i < n; i++) window.setTimeout(one, i * (90 + Math.random() * 200));
    };
    autoTimer = window.setTimeout(releaseAuto, 1200);
  }

  /* ── boot ────────────────────────────────────────────────────────── */
  var q = new URLSearchParams(location.search);
  var startLang = q.get('lang');
  if (startLang !== 'hy' && startLang !== 'en') {
    try { startLang = localStorage.getItem('c17.lang'); } catch (e) { startLang = null; }
  }

  // The day to open on: today if it has something, otherwise the next day that does.
  (function pickDay() {
    var now = today();
    var dates = DATA.events.map(function (e) { return e.date; }).concat(Object.keys(DATA.booth.slots)).sort();
    var pick = dates.filter(function (d) { return d >= now; })[0] || dates[0];
    selected = q.get('day') && /^2026-10-\d\d$/.test(q.get('day')) ? q.get('day') : pick;
  }());

  setLang(startLang === 'hy' ? 'hy' : 'en', false);
}());
