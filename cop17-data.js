/* ═══════════════════════════════════════════════════════════════════════
   COP17 — Narek Ohanyan's engagements
   ───────────────────────────────────────────────────────────────────────
   The one place to edit when a time, room or organiser is confirmed.

   Sources: the UNICEF "Calendar for COP17 youth" and the AUA Acopian
   Center side-event mastersheet. Where the two disagree, or a field was
   never given, the field is listed in `tbc` and the page shows a small
   "to be confirmed" flag instead of guessing.

   zone    'blue'   Blue Zone  — UN-managed negotiation area
           'green'  Green Zone — open to the public
           'other'  anywhere else (youth forum, university venues…)
   role    speaker | moderator | organiser | facilitator | attending
   tbc     any of: 'time', 'place', 'org', 'date', 'title'
   ═══════════════════════════════════════════════════════════════════════ */

window.COP17_DATA = {
  conference: { start: '2026-10-19', end: '2026-10-30' },

  events: [
    {
      id: 'summit',
      date: '2026-10-16', start: '09:00', end: '18:00',
      zone: 'blue', role: 'attending',
      title:   { en: 'High-Level Policy Summit (Leaders’ Summit)', hy: 'Բարձր մակարդակի քաղաքականության գագաթնաժողով (Առաջնորդների գագաթնաժողով)' },
      org:     { en: 'UN Convention on Biological Diversity (CBD)', hy: 'ՄԱԿ Կենսաբազմազանության կոնվենցիա (CBD)' },
      place:   { en: 'Blue Zone', hy: 'Կապույտ գոտի' },
      plain:   { en: 'Heads of state and ministers open the conference. Narek is in the room as part of the Armenian youth and research delegation.',
                 hy: 'Պետությունների ղեկավարներն ու նախարարները բացում են համաժողովը։ Նարեկը ներկա է որպես հայ երիտասարդների և հետազոտողների պատվիրակության անդամ։' },
      link: 'https://www.cbd.int/conferences/2026/leaders-summit',
      tbc: ['time']
    },
    {
      id: 'gybf',
      date: '2026-10-17', start: '17:30', end: '18:30',
      zone: 'other', role: 'facilitator',
      title:   { en: 'Global Youth Biodiversity Forum', hy: 'Կենսաբազմազանության համաշխարհային երիտասարդական ֆորում' },
      org:     null,
      place:   { en: 'Yerevan State University (YSU)', hy: 'Երևանի պետական համալսարան (ԵՊՀ)' },
      plain:   { en: 'Young people from around the world meet before the main conference to agree what they want governments to do for nature. Narek facilitates the session.',
                 hy: 'Համաշխարհային երիտասարդները հավաքվում են հիմնական համաժողովից առաջ՝ պայմանավորվելու, թե ինչ են ուզում կառավարություններից՝ բնության համար։ Նարեկը վարում է նիստը։' },
      tbc: ['org']
    },
    {
      id: 'closing',
      date: '2026-10-19', start: '15:30', end: '17:00',
      zone: 'green', role: 'organiser',
      title:   { en: 'Biodiversity Ambassadors Closing Ceremony', hy: 'Կենսաբազմազանության դեսպանների եզրափակիչ արարողություն' },
      org:     { en: 'Armenian University Coalition for Biodiversity (AUCB)', hy: 'Կենսաբազմազանության հարցերով հայկական բուհերի կոալիցիա (AUCB)' },
      place:   { en: 'AUCB Pavilion, Green Zone', hy: 'AUCB տաղավար, Կանաչ գոտի' },
      plain:   { en: 'The students who spent the autumn training as Biodiversity Ambassadors celebrate what they did. Narek helps organise the ceremony.',
                 hy: 'Աշնանը «Կենսաբազմազանության դեսպան» դարձած ուսանողները նշում են իրենց արածը։ Նարեկը օգնում է կազմակերպել արարողությունը։' }
    },
    {
      id: 'seeitbeit',
      date: '2026-10-22', start: '12:00', end: '13:00',
      zone: 'blue', role: 'speaker',
      title:   { en: 'See It, Be It: Nature Positive Futures Campaign Launch', hy: 'See It, Be It. «Բնության համար դրական ապագա» արշավի մեկնարկ' },
      org:     { en: 'UNICEF and UNDP (joint global campaign)', hy: 'ՅՈՒՆԻՍԵՖ և ՄԶԾ (համատեղ գլոբալ արշավ)' },
      place:   null,
      plain:   { en: 'A global campaign shows young people that careers that help nature are real and within reach. Narek is one of the featured young people and speaks at the launch, alongside Milena Tevosyan.',
                 hy: 'Գլոբալ արշավը ցույց է տալիս երիտասարդներին, որ բնության համար աշխատող մասնագիտությունները իրական են և հասանելի։ Նարեկը արշավում ներկայացված երիտասարդներից է և ելույթ է ունենում մեկնարկին՝ Միլենա Թևոսյանի հետ։' },
      tbc: ['place', 'title']
    },
    {
      id: 'forests',
      date: '2026-10-23', start: '10:00', end: '11:00',
      zone: 'green', role: 'attending',
      title:   { en: 'Climate-resilient forest ecosystems: Future pathways for Armenia', hy: 'Կլիմայակայուն անտառային էկոհամակարգեր. Հայաստանի ապագա ուղիները' },
      org:     null,
      place:   null,
      plain:   { en: 'A look at how Armenia’s forests can survive a hotter, drier climate, and what needs to happen next.',
                 hy: 'Ինչպես կարող են Հայաստանի անտառները դիմակայել ավելի տաք ու չոր կլիմային և ինչ պետք է արվի հաջորդ քայլով։' },
      tbc: ['org', 'place']
    },
    {
      id: 'foracca',
      date: '2026-10-27', start: '12:30', end: '13:30',
      zone: 'green', role: 'attending',
      title:   { en: 'New climate services for nature conservation: high-resolution climate scenarios for Dilijan National Park', hy: 'Կլիմայական նոր ծառայություններ բնության պահպանության համար. բարձր լուծաչափի կլիմայական սցենարներ Դիլիջանի ազգային պարկի համար' },
      org:     { en: 'FORACCA project', hy: 'FORACCA նախագիծ' },
      place:   null,
      plain:   { en: 'Detailed climate forecasts for one national park, so that the people protecting it can plan for what is coming. Narek attends with his AUA Acopian Center colleague Arsen Gasparyan.',
                 hy: 'Մեկ ազգային պարկի համար մանրամասն կլիմայական կանխատեսումներ, որպեսզի այն պահպանողները կարողանան պլանավորել գալիքը։ Նարեկը ներկա է գործընկեր Արսեն Գասպարյանի հետ։' },
      tbc: ['place']
    },
    {
      id: 'harvesting',
      date: '2026-10-27', start: '13:15', end: '14:30',
      zone: 'blue', role: 'speaker',
      title:   { en: 'Youth and Children Harvesting Life: agroecology, green jobs and case studies in biodiversity action', hy: 'Երիտասարդներն ու երեխաները՝ կյանքի բերքահավաքում. ագրոէկոլոգիա, կանաչ աշխատատեղեր և կենսաբազմազանության գործողությունների օրինակներ' },
      org:     null,
      place:   { en: 'GRULAC meeting room (“Ljevan”)', hy: 'GRULAC հանդիպումների սենյակ («Լջևան»)' },
      plain:   { en: 'How farming that works with nature, and the jobs that come with it, can give young people and children a real stake in protecting biodiversity. Narek speaks.',
                 hy: 'Ինչպես կարող է բնության հետ համագործակցող գյուղատնտեսությունը և դրա հետ կապված աշխատատեղերը երիտասարդներին ու երեխաներին դարձնել բնության պահպանության իրական մասնակից։ Նարեկը ելույթ է ունենում։' },
      tbc: ['org', 'time']
    },
    {
      id: 'priorities',
      date: '2026-10-29', start: '15:45', end: '16:45',
      zone: 'green', role: 'speaker',
      title:   { en: 'Youth Priorities for Nature', hy: 'Երիտասարդների առաջնահերթությունները բնության համար' },
      org:     { en: 'GYBN UK and GYBN USA', hy: 'GYBN UK և GYBN USA' },
      place:   null,
      plain:   { en: 'Young people from different countries say plainly what they want negotiators to prioritise for nature. Narek speaks.',
                 hy: 'Տարբեր երկրների երիտասարդները պարզ ասում են, թե ինչն է պետք բանակցողների համար առաջնային լինի։ Նարեկը ելույթ է ունենում։' },
      tbc: ['place']
    },
    {
      id: 'pecha',
      date: '2026-10-30', start: '14:00', end: '16:00',
      zone: 'green', role: 'speaker',
      title:   { en: 'PechaKucha: “BAZMAZAN: Living Armenia — Armenia’s Biodiversity Stories”', hy: 'PechaKucha. «ԲԱԶՄԱԶԱՆ. Ապրող Հայաստան. Հայաստանի կենսաբազմազանության պատմություններ»' },
      org:     null,
      place:   null,
      plain:   { en: 'Short, fast, picture-led talks about the wildlife and landscapes of Armenia. Narek is one of the speakers.',
                 hy: 'Կարճ, արագ, պատկերներով ելույթներ Հայաստանի բնության ու բնապատկերների մասին։ Նարեկը ելույթ ունեցողներից է։' },
      tbc: ['time', 'org', 'place']
    },
    {
      id: 'dialogue',
      date: '2026-10-30', start: null, end: null,
      zone: 'blue', role: 'moderator',
      title:   { en: 'Child and Youth Dialogue with the COP17 President', hy: 'Երեխաների և երիտասարդների երկխոսություն COP17-ի նախագահի հետ' },
      org:     { en: 'UNICEF and GYBN', hy: 'ՅՈՒՆԻՍԵՖ և GYBN' },
      place:   null,
      plain:   { en: 'Children and young people put their questions directly to the person chairing the conference. Narek moderates.',
                 hy: 'Երեխաներն ու երիտասարդները հարցեր են ուղղում անմիջապես համաժողովը ղեկավարողին։ Նարեկը վարում է։' },
      tbc: ['date', 'time', 'place']
    }
  ],

  /* The standing role: shown on every conference weekday, and in the hero. */
  booth: {
    days: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23',
           '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'],
    zone: 'blue',
    title: { en: 'Armenia Tree Project (ATP) booth', hy: 'Armenia Tree Project (ATP) տաղավար' },
    org:   { en: 'Armenia Tree Project (ATP)', hy: 'Armenia Tree Project (ATP)' },
    place: { en: 'Blue Zone', hy: 'Կապույտ գոտի' },
    plain: { en: 'Narek co-hosts the permanent ATP booth. Drop by to hear about forest restoration in Armenia, or to be connected with the right expert.',
             hy: 'Նարեկը համամասնակցում է ATP-ի մշտական տաղավարի վարմանը։ Այցելեք՝ իմանալու Հայաստանում անտառվերականգնման մասին կամ կապվելու ճիշտ փորձագետի հետ։' },
    tbc: ['place']
  }
};
