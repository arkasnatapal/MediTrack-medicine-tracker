const yogaPoses = [
    {
      id: "balasana",
      name: "Balasana (Child’s Pose)",
      intensity: "gentle",
      safeDuringPeriods: true,
      targetPainAreas: ["lower abdomen", "lower back", "hips", "cramps"],
      imageUrls: [
        "/images/yoga/balasana/1.jpg",
        "/images/yoga/balasana/2.avif"
      ],
      baseBenefits: [
        "relaxes uterine muscles",
        "reduces menstrual cramps",
        "relieves lower back tension"
      ],
      duration: "1–2 minutes"
    },
    {
      id: "supta_baddha_konasana",
      name: "Supta Baddha Konasana (Reclined Butterfly)",
      intensity: "gentle",
      safeDuringPeriods: true,
      targetPainAreas: ["cramps", "lower abdomen", "hips", "thighs"],
      imageUrls: [
        "/images/yoga/supta_baddha_konasana/1.avif",
        "/images/yoga/supta_baddha_konasana/2.jpg"
      ],
      baseBenefits: [
        "opens the hips and groin",
        "relieves stress and mild depression",
        "stimulates the ovaries and prostate gland"
      ],
      duration: "3–5 minutes"
    },
    {
      id: "viparita_karani",
      name: "Viparita Karani (Legs-Up-The-Wall)",
      intensity: "restorative",
      safeDuringPeriods: true,
      targetPainAreas: ["lower back", "legs", "thighs", "headache", "fatigue"],
      imageUrls: [
        "/images/yoga/viparita_karani/1.jpg",
        "/images/yoga/viparita_karani/2.jpg"
      ],
      baseBenefits: [
        "alleviates tired legs and feet",
        "relieves mild backache",
        "calms the mind"
      ],
      duration: "5–10 minutes"
    },
    {
      id: "cat_cow",
      name: "Marjaryasana-Bitilasana (Cat-Cow)",
      intensity: "low",
      safeDuringPeriods: true,
      targetPainAreas: ["lower back", "cramps", "spine"],
      imageUrls: [
        "/images/yoga/cat_cow/1.jpg"
      ],
      baseBenefits: [
        "improves posture and balance",
        "strengthens and stretches the spine and neck",
        "massages the abdominal organs"
      ],
      duration: "10-15 reps"
    },
    {
      id: "savasana",
      name: "Savasana (Corpse Pose)",
      intensity: "restorative",
      safeDuringPeriods: true,
      targetPainAreas: ["headache", "fatigue", "anxiety", "stress"],
      imageUrls: [
        "/images/yoga/savasana/1.webp",
        "/images/yoga/savasana/2.webp"
      ],
      baseBenefits: [
        "calms the brain and helps relieve stress and mild depression",
        "relaxes the body",
        "reduces headache"
      ],
      duration: "5–10 minutes"
    },
    {
        id: "janu_sirsasana",
        name: "Janu Sirsasana (Head-to-Knee Forward Bend)",
        intensity: "low",
        safeDuringPeriods: true,
        targetPainAreas: ["lower back", "hips", "thighs", "hamstrings"],
        imageUrls: [
           "/images/yoga/janu_sirsasana/1.webp",
            "/images/yoga/janu_sirsasana/2.jpg"
        ],
        baseBenefits: [
             "Calms the brain and helps relieve mild depression",
             "Stretches the spine, shoulders, hamstrings, and groins",
             "Stimulates the liver and kidneys"
        ],
        duration: "1-2 minutes per side"
    },
    {
        id: "supta_matsyendrasana",
        name: "Supta Matsyendrasana (Supine Spinal Twist)",
        intensity: "gentle",
        safeDuringPeriods: true,
        targetPainAreas: ["lower back", "spine", "hips", "digestion"],
        imageUrls: [
            "/images/yoga/supta_matsyendrasana/1.jpg",
            "/images/yoga/supta_matsyendrasana/2.jpeg"
        ],
        baseBenefits: ["Stretches the back muscles and glutes", "Massages the back and hips", "Helps hydrate the spinal disks"],
        duration: "1-2 minutes per side"
    },
    {
        id: "uttanasana",
        name: "Uttanasana (Standing Forward Bend)",
        intensity: "medium",
        safeDuringPeriods: true,
        targetPainAreas: ["hips", "thighs", "calves", "lower back"],
        imageUrls: [
            "/images/yoga/uttanasana/1.webp",
            "/images/yoga/uttanasana/2.webp"
        ],
        baseBenefits: ["Stretches the hips, hamstrings, and calves", "Strengthens the thighs and knees", "Keeps your spine strong and flexible"],
        duration: "1 minute"
    }
  ];
  
  module.exports = yogaPoses;
