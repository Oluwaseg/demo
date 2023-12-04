exports.getHome = (req, res) => {
  if (req.isAuthenticated()) {
    const userData = req.user;
    res.render("home.ejs", { user: userData });
  } else {
    console.log("no user");
    res.redirect("/login");
  }
};

exports.getAbout = (req, res) => {
  res.render("about.ejs");
};

exports.getFeatures = (req, res) => {
  res.render("coin_tracker.ejs");
};

exports.getLogout = (req, res) => {
  req.logout();
  res.redirect("/login");
};
