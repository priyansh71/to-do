require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome.",
});

const array = [item1];

app.get("/", function (req, res) {
  Item.find((err, items) => {
    if (items.length === 0) {
      Item.insertMany(array);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "My To-do's", newListItems: items });
    }
  });
});

app.post("/", function (req, res) {
  const item = req.body.newItem;
  const listName = req.body.list;

  const newElement = new Item({
    name: item,
  });

  if (listName === "My To-do's") {
    newElement.save();
    res.redirect("/");
  } else {
    List.findOne(
      {
        name: listName,
      },
      (err, list) => {
        if (err) {
          console.log(err);
        } else {
          list.items.push(newElement);
          list.save();
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.post("/delete", function (req, res) {
  const id = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "My To-do's") {
    Item.findOneAndDelete({ _id: id }, (err) => {
      if (!err) {
        res.redirect("/");
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate(
      {
        name: listName,
      },
      {
        $pull: { items: { _id: id } },
      },
      (err) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customName", (req, res) => {
  const custom = _.capitalize(req.params.customName);

  if (
    List.findOne({ name: custom }, (err, list) => {
      if (err) {
        console.log(err);
      } else if (list) {
        res.render("list", { listTitle: list.name, newListItems: list.items });
      } else {
        const list = new List({
          name: custom,
          items: array,
        });

        list.save();
        res.render("list", { listTitle: list.name, newListItems: list.items });
      }
    })
  );
});

app.listen(process.env.VALUE, function () {
  console.log("Server started.");
});
