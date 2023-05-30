const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use("/css" ,express.static("public/css"));
app.use("/images" ,express.static("public/images"));

const userName = process.env.USER_NAME;
const password = process.env.PASSWORD;

mongoose.connect('mongodb+srv://'+ userName + ':' + password + '@cluster0.yhpq35y.mongodb.net/todolistDB');

const day = date.getDate();
const PORT = process.env.PORT || 3000;

const itemsSchema = new mongoose.Schema ({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name: "Welcome to your To Do List!"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item."
});

const item3 = new Item ({
    name: "<-- Hit this to delete an item."
});

const defualtItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

    Item.find({}).then(function(foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defualtItems).then(function() {
                console.log("Successfully inseted documents.");
            }).catch(function(err) {
                console.log(err);
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: day, newListItems: foundItems});
        }
    }).catch(function(err) {
        console.log(err);
    });
}); 

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;


    const newItem = new Item ({
        name: itemName
    });
    

    if (listName === day) {
        newItem.save();
        res.redirect("/")
    } else{
        List.findOne({name: listName}).then(function(foundList) {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        }).catch(function(err) {
            console.log(err);
        });
    }


});

app.post("/delete", function(req, res){
 
    const checkedItemId = req.body.checkbox.trim();
    const listName = req.body.listName;
   
    if(listName === day) {
   
      Item.findByIdAndRemove(checkedItemId).then(function(foundItem){Item.deleteOne({_id: checkedItemId})})
   
      res.redirect("/");
   
    } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function (foundList)
        {
          res.redirect("/" + listName);
        });
    }
   
});

app.get("/:newListName", function(req, res) {
    const newList = _.capitalize(req.params.newListName);

    List.findOne({name: newList}).then(function(foundList) {
        if (!foundList) {
            const list = new List ({
                name: newList,
                items: defualtItems
            });

            list.save();
            setTimeout(() => { res.redirect('/' + newList);}, 1000);
        }else {
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
    }).catch(function(err) {
        console.log(err);
    });

});


app.listen(PORT, function() {
    console.log(`Server started on port ${PORT}`);
});
