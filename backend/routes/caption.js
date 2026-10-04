import express from 'express';

const router = express.Router();

const CAPTION_BANK = {
  cute: [
    ['A little sweetness, a lot of us.', ['#SoftMoments', '#LittleJoy', '#VYBE']],
    ['Saving this tiny happy moment.', ['#SweetDays', '#GoodTogether', '#VYBE']],
    ['Cute looks good on this crew.', ['#PlayfulMood', '#PhotoDay', '#VYBE']],
  ],
  natural: [
    ['Nothing posed, everything us.', ['#InTheMoment', '#EverydayMagic', '#VYBE']],
    ['The good bit happened between takes.', ['#Unscripted', '#GoodCompany', '#VYBE']],
    ['Just here, just like this.', ['#KeepItReal', '#LittleMemories', '#VYBE']],
  ],
  confident: [
    ['Show up like you mean it.', ['#OwnYourFrame', '#SelfAssured', '#VYBE']],
    ['Comfortable in our own spotlight.', ['#NoSecondGuessing', '#Presence', '#VYBE']],
    ['A look that speaks for itself.', ['#StandTall', '#MakeAnEntrance', '#VYBE']],
  ],
  romantic: [
    ['A little closer to my favorite place.', ['#GoldenHourHearts', '#CloseToYou', '#VYBE']],
    ['Keeping this one just a little longer.', ['#OurKindOfLove', '#SlowMoments', '#VYBE']],
    ['Some moments say it all.', ['#SoftFocus', '#AlwaysUs', '#VYBE']],
  ],
  cool: [
    ['No rush. No extra noise.', ['#QuietConfidence', '#EasyDoesIt', '#VYBE']],
    ['The calm is the whole point.', ['#CleanLines', '#LowKey', '#VYBE']],
    ['Nothing to prove, just a good frame.', ['#Understated', '#GoodLight', '#VYBE']],
  ],
  bold: [
    ['We came to take up space.', ['#MakeItCount', '#BigEnergy', '#VYBE']],
    ['Turn the volume all the way up.', ['#FullSend', '#NoSmallMoves', '#VYBE']],
    ['A little louder looks good on us.', ['#OwnTheMoment', '#Unmissable', '#VYBE']],
  ],
};

// POST /caption { vibe, peopleCount }
router.post('/', (req, res) => {
  const vibe = String(req.body?.vibe || '').toLowerCase();
  const peopleCount = String(req.body?.peopleCount || '').toLowerCase();
  const variations = CAPTION_BANK[vibe];
  if (!variations || !['solo', 'couple', 'friends', 'group'].includes(peopleCount)) {
    return res.status(400).json({ error: 'Invalid vibe or peopleCount' });
  }

  res.json({
    variations: variations.map(([caption, hashtags]) => ({ caption, hashtags: [...hashtags] })),
  });
});

export default router;