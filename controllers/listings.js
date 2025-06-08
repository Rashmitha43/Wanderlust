const Listing=require("../models/listing");
const mbxGeocoding=require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient=mbxGeocoding({accessToken:mapToken});


module.exports.index = async (req, res) => {
    const { category } = req.query;
    let allListings;
    if (category) {
        allListings = await Listing.find({ category });
    } else {
        allListings = await Listing.find({});
    }
    res.render("listings/index.ejs", { allListings });
};

module.exports.showListing=async(req,res)=>{
    let {id} =req.params;
    const listing= await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for does not exist!!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing});
};

module.exports.createListing=async(req,res)=>{

        let response=await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
         limit: 1
        })
       .send();

         console.log(response.body.features[0].geometry);
         let url=req.file.path;
         let filename=req.file.filename;

    //let {title,description,image,price,location,country} =req.body;
        const newListing=new Listing(req.body.listing);
        newListing.owner=req.user._id;
        newListing.image={url,filename};

        newListing.geometry=response.body.features[0].geometry;

        await newListing.save();
        req.flash("success","New listing created!!");
        res.redirect("/listings");
};

module.exports.renderEditForm=async(req,res)=>{
    let {id} =req.params;
    const listing= await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!!");
        return res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing=async(req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
  
    if(typeof req.file !== "undefined"){
    let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();
    }
    req.flash("success","Listing updated!!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing=async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing deleted successfully!!");
    res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
  try {
    const { q } = req.query;  // The search query string
    
    if (!q) {
      // If no query provided, show all listings or empty result
      return res.render('listings/index.ejs', { allListings: [] });
    }

    // Case-insensitive partial match on location or country
    const allListings = await Listing.find({
      $or: [
        { location: { $regex: q, $options: 'i' } },
        { country: { $regex: q, $options: 'i' } }
      ]
    });

    res.render('listings/index.ejs', { allListings, searchQuery: q });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error during search');
    res.redirect('/listings');
  }
};

// module.exports.searchListings = async (req, res) => {
//   const searchQuery = req.query.q || '';
//   // Simple case-insensitive search on location or country
//   const regex = new RegExp(searchQuery, 'i');
//   const allListings = await Listing.find({
//     $or: [
//       { location: regex },
//       { country: regex }
//     ]
//   });

//   res.render('listings/index.ejs', { allListings, searchQuery });
// };


