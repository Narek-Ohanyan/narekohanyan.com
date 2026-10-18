/* ═══════════════════════════════════════════════════════════════════════
   COP17 — Narek Ohanyan's calendar
   ───────────────────────────────────────────────────────────────────────
   The one place to edit when a time, room or organiser changes.

   Source: "COP17 Calendar - Narek" (the owner's own schedule, 18 Oct 2026),
   which replaces the earlier UNICEF youth calendar + Acopian mastersheet
   reading. Anything marked TBD there is listed in `tbc` and shown on the
   page as "to be confirmed".

   zone    'blue'   Blue Zone  — UN-managed negotiation area
           'green'  Green Zone — open to the public
           'other'  anywhere else (youth forum, university venues, field trips…)
   role    speaker | moderator | facilitator | attending | programlead |
           panelist | participant   (or `roleText` for a custom label)
   tbc     any of: 'time', 'place', 'org', 'date'

   The ATP booth is listed separately (`booth.slots`) because it repeats
   every day, in time slots. Co-hosting the booth does not block the
   calendar: the page says so, and invites speaking requests.
   ═══════════════════════════════════════════════════════════════════════ */

window.COP17_DATA = {
  conference: { start: '2026-10-19', end: '2026-10-30' },

  events: [
    {
      id: 'summit',
      date: '2026-10-16', start: '07:45', end: '18:00',
      zone: 'blue', role: 'attending',
      title:   { en: 'Leaders’ Summit', hy: 'Առաջնորդների գագաթնաժողով' },
      org:     { en: 'COP17 Presidency, CBD', hy: 'COP17-ի նախագահություն, CBD' },
      place:   { en: 'Blue Zone, Aragats Plenary Hall', hy: 'Կապույտ գոտի, Արագած լիագումար սրահ' },
      plain:   { en: 'Heads of state and ministers open the conference with a day of speeches, ending in the Yerevan Declaration. Narek attends.',
                 hy: 'Պետությունների ղեկավարներն ու նախարարները բացում են համաժողովը ելույթներով, որոնք ավարտվում են Երևանի հռչակագրով։ Նարեկը ներկա է։' },
      link: 'https://www.cbd.int/conferences/2026/leaders-summit'
    },
    {
      id: 'gybf17',
      date: '2026-10-17', start: '17:30', end: '19:00',
      zone: 'other', role: 'facilitator',
      title:   { en: 'Global Youth Biodiversity Forum', hy: 'Կենսաբազմազանության համաշխարհային երիտասարդական ֆորում' },
      org:     { en: 'GYBN Armenia', hy: 'GYBN Հայաստան' },
      place:   { en: 'Yerevan State University (YSU)', hy: 'Երևանի պետական համալսարան (ԵՊՀ)' },
      plain:   { en: 'Young people from around the world meet before the main conference to agree what they want governments to do for nature. Narek facilitates the session.',
                 hy: 'Համաշխարհային երիտասարդները հավաքվում են հիմնական համաժողովից առաջ՝ պայմանավորվելու, թե ինչ են ուզում կառավարություններից՝ բնության համար։ Նարեկը վարում է նիստը։' }
    },
    {
      id: 'gybf18',
      date: '2026-10-18', start: '15:00', end: '16:00',
      zone: 'other', role: 'moderator',
      title:   { en: 'Global Youth Biodiversity Forum', hy: 'Կենսաբազմազանության համաշխարհային երիտասարդական ֆորում' },
      org:     { en: 'GYBN Armenia', hy: 'GYBN Հայաստան' },
      place:   { en: 'Yerevan State University (YSU)', hy: 'Երևանի պետական համալսարան (ԵՊՀ)' },
      plain:   { en: 'The second day of the youth forum. Narek moderates a session.',
                 hy: 'Երիտասարդական ֆորումի երկրորդ օրը։ Նարեկը վարում է նիստ։' }
    },
    {
      id: 'opening',
      date: '2026-10-18', start: '18:00', end: '20:00',
      zone: 'blue', role: 'attending',
      title:   { en: 'Opening Ceremony of the UN Biodiversity Conference', hy: 'ՄԱԿ Կենսաբազմազանության համաժողովի բացման արարողություն' },
      org:     { en: 'CBD', hy: 'CBD' },
      place:   { en: 'Blue Zone, Aragats Plenary Hall', hy: 'Կապույտ գոտի, Արագած լիագումար սրահ' },
      plain:   { en: 'The official opening of COP17, with the host country and the UN Convention on Biological Diversity. Narek attends.',
                 hy: 'COP17-ի պաշտոնական բացումը՝ հյուրընկալող երկրի և ՄԱԿ Կենսաբազմազանության կոնվենցիայի մասնակցությամբ։ Նարեկը ներկա է։' }
    },
    {
      id: 'closing',
      date: '2026-10-19', start: '15:30', end: '17:00',
      zone: 'green', role: 'programlead',
      title:   { en: 'Biodiversity Ambassadors Program Closing Ceremony', hy: '«Կենսաբազմազանության դեսպաններ» ծրագրի եզրափակիչ արարողություն' },
      org:     { en: 'AUA Acopian Center', hy: 'ՀԱՀ Յակոբեան բնապահպանական կենտրոն' },
      place:   { en: 'Green Zone, AUCB Pavilion', hy: 'Կանաչ գոտի, AUCB տաղավար' },
      plain:   { en: 'The students who trained as Biodiversity Ambassadors this autumn celebrate what they did. Narek leads the program.',
                 hy: 'Աշնանը «Կենսաբազմազանության դեսպան» դարձած ուսանողները նշում են իրենց արածը։ Նարեկը ծրագրի ղեկավարն է։' }
    },
    {
      id: 'unicef-meeting',
      date: '2026-10-20', start: '12:00', end: '13:00',
      zone: 'blue', role: 'attending',
      title:   { en: 'UNICEF Delegation Meeting', hy: 'UNICEF-ի պատվիրակության հանդիպում' },
      org:     { en: 'UNICEF', hy: 'UNICEF' },
      place:   { en: 'Blue Zone, UN Pavilion', hy: 'Կապույտ գոտի, ՄԱԿ-ի տաղավար' },
      plain:   { en: 'The UNICEF delegation meets to coordinate its work for children and young people at COP17. Narek is a member of the delegation.',
                 hy: 'UNICEF-ի պատվիրակությունը հանդիպում է COP17-ում երեխաների և երիտասարդների համար իր աշխատանքը համակարգելու համար։ Նարեկը պատվիրակության անդամ է։' }
    },
    {
      id: 'seeitbeit',
      date: '2026-10-22', start: '12:00', end: '13:00',
      zone: 'blue', role: 'speaker',
      roleText: { en: 'Speaker and featured in the campaign', hy: 'Բանախոս և արշավի հերոսներից' },
      title:   { en: 'See It, Be It: Nature Positive Futures Campaign Launch', hy: 'See It, Be It. «Բնության համար դրական ապագա» արշավի մեկնարկ' },
      org:     { en: 'UNDP, UNICEF', hy: 'ՄԶԾ, UNICEF' },
      place:   { en: 'Blue Zone, UN Pavilion', hy: 'Կապույտ գոտի, ՄԱԿ-ի տաղավար' },
      plain:   { en: 'A global campaign shows young people that careers that help nature are real and within reach. Narek is one of the young people featured and speaks at the launch.',
                 hy: 'Գլոբալ արշավը ցույց է տալիս երիտասարդներին, որ բնության համար աշխատող մասնագիտությունները իրական են և հասանելի։ Նարեկը արշավում ներկայացված երիտասարդներից է և ելույթ է ունենում մեկնարկին։' }
    },
    {
      id: 'forests',
      date: '2026-10-23', start: '10:00', end: '11:00',
      zone: 'green', role: 'speaker',
      title:   { en: 'Climate-resilient forest ecosystems: Future pathways for Armenia', hy: 'Կլիմայակայուն անտառային էկոհամակարգեր. Հայաստանի ապագա ուղիները' },
      org:     { en: 'Swiss Federal Institute for Forest, Snow and Landscape Research (WSL)', hy: 'Շվեյցարական անտառների, ձյան և լանդշաֆտի հետազոտության դաշնային ինստիտուտ (WSL)' },
      place:   { en: 'Green Zone', hy: 'Կանաչ գոտի' },
      plain:   { en: 'How Armenia’s forests can survive a hotter, drier climate, and what needs to happen next. Narek speaks.',
                 hy: 'Ինչպես կարող են Հայաստանի անտառները դիմակայել ավելի տաք ու չոր կլիմային և ինչ պետք է արվի հաջորդ քայլով։ Նարեկը ելույթ է ունենում։' }
    },
    {
      id: 'sevan',
      date: '2026-10-25', start: '08:00', end: '18:00',
      zone: 'other', role: 'participant',
      title:   { en: 'N&C Summit field trip', hy: 'N&C գագաթնաժողովի դաշտային այց' },
      org:     { en: 'Ministry of Environment', hy: 'Շրջակա միջավայրի նախարարություն' },
      place:   { en: 'Sevan', hy: 'Սևան' },
      plain:   { en: 'A full-day field trip to Lake Sevan, organised by the Ministry of Environment for the N&C Summit.',
                 hy: 'Սևանա լիճ օրվա ընթացքի դաշտային այց՝ Շրջակա միջավայրի նախարարության կազմակերպմամբ՝ N&C գագաթնաժողովի շրջանակում։' }
    },
    {
      id: 'dialogue26',
      date: '2026-10-26', start: null, end: null,
      zone: 'blue', role: 'moderator',
      title:   { en: 'Child and Youth Dialogue with the COP17 President', hy: 'Երեխաների և երիտասարդների երկխոսություն COP17-ի նախագահի հետ' },
      org:     { en: 'UNICEF', hy: 'UNICEF' },
      place:   { en: 'Blue Zone, UN Pavilion', hy: 'Կապույտ գոտի, ՄԱԿ-ի տաղավար' },
      plain:   { en: 'Children and young people put their questions directly to the person chairing the conference. Narek moderates.',
                 hy: 'Երեխաներն ու երիտասարդները հարցեր են ուղղում անմիջապես համաժողովը ղեկավարողին։ Նարեկը վարում է։' },
      tbc: ['time']
    },
    {
      id: 'foracca',
      date: '2026-10-27', start: '12:30', end: '13:30',
      zone: 'green', role: 'panelist',
      title:   { en: 'New climate services for nature conservation: the potential of high-resolution climate scenarios for Dilijan National Park', hy: 'Կլիմայական նոր ծառայություններ բնության պահպանության համար. բարձր լուծաչափի կլիմայական սցենարներ Դիլիջանի ազգային պարկի համար' },
      org:     { en: 'Swiss Federal Institute for Forest, Snow and Landscape Research (WSL)', hy: 'Շվեյցարական անտառների, ձյան և լանդշաֆտի հետազոտության դաշնային ինստիտուտ (WSL)' },
      place:   { en: 'Green Zone', hy: 'Կանաչ գոտի' },
      plain:   { en: 'Detailed climate forecasts for one national park, so that the people protecting it can plan for what is coming. Narek is on the panel.',
                 hy: 'Մեկ ազգային պարկի համար մանրամասն կլիմայական կանխատեսումներ, որպեսզի այն պահպանողները կարողանան պլանավորել գալիքը։ Նարեկը քննարկման մասնակից է։' }
    },
    {
      id: 'harvesting',
      date: '2026-10-27', start: '13:15', end: '14:30',
      zone: 'blue', role: 'speaker',
      title:   { en: 'Youth and Children Harvesting Life: agroecology, green jobs and case studies in biodiversity action', hy: 'Երիտասարդներն ու երեխաները՝ կյանքի բերքահավաքում. ագրոէկոլոգիա, կանաչ աշխատատեղեր և կենսաբազմազանության գործողությունների օրինակներ' },
      org:     { en: 'GYBN', hy: 'GYBN' },
      place:   { en: 'Blue Zone, GRULAC meeting room', hy: 'Կապույտ գոտի, GRULAC հանդիպումների սենյակ' },
      plain:   { en: 'How farming that works with nature, and the jobs that come with it, can give young people and children a real stake in protecting biodiversity. Narek speaks.',
                 hy: 'Ինչպես կարող է բնության հետ համագործակցող գյուղատնտեսությունը և դրա հետ կապված աշխատատեղերը երիտասարդներին ու երեխաներին դարձնել բնության պահպանության իրական մասնակից։ Նարեկը ելույթ է ունենում։' }
    },
    {
      id: 'priorities',
      date: '2026-10-29', start: '15:45', end: '16:45',
      zone: 'green', role: 'speaker',
      title:   { en: 'Youth Priorities for Nature', hy: 'Երիտասարդների առաջնահերթությունները բնության համար' },
      org:     { en: 'GYBN UK and GYBN USA', hy: 'GYBN UK և GYBN USA' },
      place:   { en: 'Green Zone', hy: 'Կանաչ գոտի' },
      plain:   { en: 'Young people from different countries say plainly what they want negotiators to prioritise for nature. Narek speaks.',
                 hy: 'Տարբեր երկրների երիտասարդները պարզ ասում են, թե ինչն է պետք բանակցողների համար առաջնային լինի։ Նարեկը ելույթ է ունենում։' }
    },
    {
      id: 'dialogue30',
      date: '2026-10-30', start: null, end: null,
      zone: 'blue', role: 'moderator',
      title:   { en: 'Child and Youth Dialogue with the COP17 President', hy: 'Երեխաների և երիտասարդների երկխոսություն COP17-ի նախագահի հետ' },
      org:     { en: 'UNICEF', hy: 'UNICEF' },
      place:   { en: 'Blue Zone, UN Pavilion', hy: 'Կապույտ գոտի, ՄԱԿ-ի տաղավար' },
      plain:   { en: 'A second dialogue in which children and young people question the person chairing the conference. Narek moderates.',
                 hy: 'Երկրորդ երկխոսությունը, որում երեխաներն ու երիտասարդները հարցեր են ուղղում համաժողովը ղեկավարողին։ Նարեկը վարում է։' },
      tbc: ['time']
    },
    {
      id: 'pecha',
      date: '2026-10-30', start: '13:35', end: '16:00',
      zone: 'green', role: 'speaker',
      title:   { en: 'PechaKucha: “BAZMAZAN: Living Armenia — Armenia’s Biodiversity Stories”', hy: 'PechaKucha. «ԲԱԶՄԱԶԱՆ. Ապրող Հայաստան. Հայաստանի կենսաբազմազանության պատմություններ»' },
      org:     { en: 'PK Yerevan, UNICEF, ATP', hy: 'PK Yerevan, UNICEF, ATP' },
      place:   { en: 'Green Zone, Main Stage', hy: 'Կանաչ գոտի, գլխավոր բեմ' },
      plain:   { en: 'Short, fast, picture-led talks about the wildlife and landscapes of Armenia. Narek is one of the speakers.',
                 hy: 'Կարճ, արագ, պատկերներով ելույթներ Հայաստանի բնության ու բնապատկերների մասին։ Նարեկը ելույթ ունեցողներից է։' }
    }
  ],

  /* The standing role: Armenia Tree Project booth, in time slots.
     It does NOT block the calendar — Narek is open to speaking requests. */
  booth: {
    zone: 'blue',
    title: { en: 'Armenia Tree Project (ATP) booth', hy: 'Armenia Tree Project (ATP) տաղավար' },
    org:   { en: 'Armenia Tree Project (ATP)', hy: 'Armenia Tree Project (ATP)' },
    place: { en: 'Blue Zone, ATP booth', hy: 'Կապույտ գոտի, ATP տաղավար' },
    plain: { en: 'Narek co-hosts the permanent ATP booth. Drop by to hear about forest restoration in Armenia, or to be connected with the right expert.',
             hy: 'Նարեկը համամասնակցում է ATP-ի մշտական տաղավարի վարմանը։ Այցելեք՝ իմանալու Հայաստանում անտառվերականգնման մասին կամ կապվելու ճիշտ փորձագետի հետ։' },
    slots: {
      '2026-10-19': [['09:00', '14:00'], ['18:00', '20:00']],
      '2026-10-20': [['09:00', '20:00']],
      '2026-10-21': [['09:00', '20:00']],
      '2026-10-22': [['09:00', '11:00'], ['13:00', '20:00']],
      '2026-10-23': [['14:00', '20:00']],
      '2026-10-24': [['14:00', '20:00']],
      '2026-10-26': [['09:00', '20:00']],
      '2026-10-27': [['15:00', '20:00']],
      '2026-10-28': [['09:00', '20:00']],
      '2026-10-29': [['09:00', '15:00'], ['18:00', '20:00']],
      '2026-10-30': [['09:00', '12:00'], ['17:00', '20:00']]
    }
  }
};
