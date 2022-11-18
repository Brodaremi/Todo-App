const express = require ("express");
const bodyParser = require ("body-parser");
const mongoose = require("mongoose");
// const date = require (__dirname + "/date.js");
const morgan = require("morgan");
const _ = require("lodash");


const app = express()
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(morgan("tiny"));

mongoose.connect('mongodb://0.0.0.0:27017/TodoAppDatabase', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    console.log("Mongo connection open");
})
.catch(err =>{
    console.log('Mongo connection error');
    console.log(err);
})

const itemSchema = {
  name: String
};
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({name: "Welcome to your todo list"});
const item2 = new Item({name: "Hit the + button to add a new todo"});
const item3 = new Item({name: "<-- Hit this button to delete an item"});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
}
const List = mongoose.model("List", listSchema);


app.get("/", (req, res) => {
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Success");
        }
      })      
      res.redirect("/")
    }else{
      res.render("index",{listTitle: "Today", newListItems: foundItems});
    }    
  })
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  console.log(customListName);

  List.findOne({name: customListName}, function (err, foundList) {
    if(!err){
      if (!foundList) {
        //Create a new list
        const list = new List({name: customListName, items: defaultItems});
        list.save();
        res.redirect("/" + customListName);
        // console.log("Does'nt exist");
      }else {
        // SHow existing list
        res.render("index", {listTitle: foundList.name, newListItems: foundList.items})
        // console.log("Exist");
      }
    }
  })
})




app.post("/", (req, res) => {
  const  itemName = req.body.newItem;
  const listName = req.body.list;
  // console.log(listName);

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      // console.log(foundList);
      res.redirect("/" + listName);
    })
  }
});


app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted");
        res.redirect("/")
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, foundList) {
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }
})



app.listen(3000,() => {
    console.log("Server started on port 3000");
});