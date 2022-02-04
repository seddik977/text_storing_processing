const Text = require("../models/TextModel");
const express = require("express");
const router = express.Router();
const wordcount = require("wordcount.js");
const ObjectId = require("mongoose").Types.ObjectId;
const Fuse = require("fuse.js");

// POST TEXT
router.post("/", (req, res) => {
  const New = new Text(
    JSON.parse(
      JSON.stringify({
        versions: {
          ar: req.body.arabe || "",
          en: req.body.english || "",
          fr: req.body.french || "",
        },
        state: "Draft",
      })
    )
  );

  New.save()
    .then((text) => res.json(text))
    .catch((error) => {
      res.status(400).json({ message: "error : " + error });
    });
});
////**************////
// GET ALL

router.get("/", async (req, res) => {
  if (req.query.limit) {
    Text.paginate({}, { page: req.query.page || 1, limit: req.query.limit })
      .then((data) => {
        res.status(200).json({
          data,
        });
      })
      .catch((error) => {
        res.status(400).json({ message: "error : " + error });
      });
  } else {
    Text.find()
      .then((data) => {
        res.status(200).json({ data });
      })
      .catch((error) => {
        res.status(400).json({ message: "error : " + error });
      });
  }
});

////**************////
// GET AND COUNT
///:textId/count
router.get("/:textId/count", (req, res) => {
  const textId = req.params.textId;
  if (!isValidObjectId(textId)) {
    res.status(400).json("invalid ObjectId");
    return;
  }

  Text.findById(textId)
    .then((text) => {
      const NB_WORDS = {
        NB_ARABE: wordcount(text.versions.ar),
        NB_ENGLISH: wordcount(text.versions.en),
        NB_FRENCH: wordcount(text.versions.fr),
      };
      res.json(NB_WORDS);
    })
    .catch((error) => {
      res.status(400).json({ message: "error : " + error });
    });
});
////**************////
// COUNT NB WORD FOR A GIVING LANGUAGES

router.get("/:textId/count/:language", (req, res) => {
  const textId = req.params.textId;
  const language = req.params.language;

  if (!isValidObjectId(textId)) {
    res.status(400).json("invalid ObjectId");
    return;
  }
  code = 200;
  Text.findById(textId)
    .then((text) => {
      if (language == "ar") {
        str = { NB_ARAB: wordcount(text.versions.ar) };
      } else if (language == "en") {
        str = { NB_ENGLISH: wordcount(text.versions.en) };
      } else if (language == "fr") {
        str = { NB_FRENSH: wordcount(text.versions.fr) };
      } else {
        code = 400;
        str = "invaid language";
      }
      res.status(code).json(str);
    })
    .catch((err) => {
      res.status(401).json({ message: "error has occured : " + err });
    });
});
// PUT
router.put("/:textId", (req, res) => {
  const textId = req.params.textId;
  console.log(textId);

  if (!isValidObjectId(textId)) {
    res.status(400).json("invalid ObjectId");
    return;
  }
  Text.exists({ _id: textId }).then((exist) => {
    if (!exist) {
      res.status(400).json("id dont exist here");
      return;
    }
    Text.findByIdAndUpdate(
      textId,
      {
        $set: {
          "versions.fr": req.body.french,
          "versions.ar": req.body.arabe,
          "versions.en": req.body.english,
        },
      },
      { new: true },
      (err, docs) => {
        if (!err) {
          res.status(200).send({
            versions: {
              ar: docs.versions.ar,
              en: docs.versions.en,
              fr: docs.versions.fr,
            },
          });
        } else {
          console.log(
            "Error while updating the data" + JSON.stringify(err, undefined, 2)
          );
        }
      }
    );
  });
});
////// fuzzy search
router.get("/search", async (req, res) => {
  const q = req.query.q;

  if (q.trim().length === 0) {
    res.status(400).json("the query is empty");
    return;
  }

  try {
    Text.find().then((list) => {
      const options = {
        shouldSort: true,
        includeMatches: true,
        keys: ["versions.ar", "versions.en", "versions.fr"],
      };
      const fuse = new Fuse(list, options);

      const result = fuse.search(q);
      res.status(200).json(result);
    });
  } catch (err) {
    res.status(400).json({ message: "error  : " + error });
  }
});

/////////// most current word
router.get("/mostOccurrent", (req, res) => {
  try {
    Text.find({}, { projection: { _id: 0 } })
      .then((result) => {
        var regex = /[123!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
        newResult = result.map((item) => {
          return [
            {
              1: item.versions.ar,
              2: item.versions.en,
              3: item.versions.fr,
            },
          ];
        });

        array = JSON.stringify(newResult);

        RemovedArray = removePunctuation(array, regex);

        finalResult = findMostRepeatedWord(RemovedArray);
        res.status(200).json(finalResult);
      })
      .catch((err) => {
        res.status(400).json({ message: "error  : " + error });
        console.log(err);
      });
  } catch (error) {
    res.status(400).json({ message: "error  : " + error });
    console.log(error);
  }
});
////// submit a draft

router.get("/Submit/:textId", (req, res) => {
  const textId = req.params.textId;

  if (!isValidObjectId(textId)) {
    res.status(400).json("invalid ObjectId");
    return;
  }
  Text.exists({ _id: textId }).then((exist) => {
    if (!exist) {
      res.status(400).json("id dont exist here");
      return;
    }
    Text.findById(textId)
      .then((text) => {
        let State = text.state;

        if (State !== "Draft" && State !== "Rejected") {
          res.status(201).json("this text has already been submited");
          return;
        } else {
          Text.findByIdAndUpdate(
            textId,
            {
              $set: {
                state: "Submitted",
              },
            },
            { new: true },
            (err, newtext) => {
              if (!err) {
                res.status(200).send({
                  message: "the text was submitted successfully",
                  data: newtext,
                });
              } else {
                console.log(
                  "Error while sumbmitting the text" +
                    JSON.stringify(err, undefined, 2)
                );
                res.status(400).json({
                  message: "Error while sumbmitting the text  : " + error,
                });
              }
            }
          );
        }
      })
      .catch((error) => {
        res.status(400).json({ message: "error  : " + error });
      });
  });
});
router.get("/approval/:textId", (req, res) => {
  const textId = req.params.textId;
  if (!isValidObjectId(textId)) {
    res.status(400).json("invalid ObjectId");
    return;
  }
  Text.exists({ _id: textId }).then((exist) => {
    if (!exist) {
      res.status(400).json("id dont exist here");
      return;
    }
    Text.findById(textId)
      .then((text) => {
        let State = text.state;
        console.log(State);
        if (State !== "Submitted") {
          res.status(201).json("this text is not in submitted state ");
          return;
        } else {
          const num = random();
          console.log(num);
          array = ["Approuved", "Rejected"];
          Text.findByIdAndUpdate(
            textId,
            {
              $set: {
                state: array[num],
              },
            },
            { new: true },
            (err, newtext) => {
              if (!err) {
                if (array[num] == "Approuved") {
                  res.status(200).send({
                    message: "the text was Approuved ",
                    data: newtext,
                  });
                } else {
                  res.status(200).send({
                    message: "the text was Rejected ",
                    data: newtext,
                  });
                }
              } else {
                console.log(
                  "Error while approuving or rejecting the text" +
                    JSON.stringify(err, undefined, 2)
                );
                res.status(400).json({
                  message: "Error while sumbmitting the text  : " + error,
                });
              }
            }
          );
        }
      })
      .catch((error) => {
        res.status(400).json({ message: "error  : " + error });
      });
  });
});
/////////////////// verify ObjectId

function isValidObjectId(id) {
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) return true;
    return false;
  }
  return false;
}
/// regex
function removePunctuation(string, regex) {
  return string.replace(regex, "  ");
}
///// random pick
function random() {
  var y = Math.random();
  if (y < 0.5) {
    y = 0;
    return y;
  } else {
    y = 1;
    return y;
  }
}
//////// Most occurent

function findMostRepeatedWord(str) {
  let words = str.match(/\w+/g);
  //console.log(words);

  let occurances = {};

  for (let word of words) {
    if (occurances[word]) {
      occurances[word]++;
    } else {
      occurances[word] = 1;
    }
  }

  //console.log(occurances);

  let max = 0;
  let mostRepeatedWord = "";

  for (let word of words) {
    if (occurances[word] > max) {
      max = occurances[word];
      mostRepeatedWord = word;
    }
  }

  return { "most current Word is ": mostRepeatedWord };
}
module.exports = router;
