taskSchema.pre("save", function (next) {
  if (this.timeStart && this.timeFinish && this.timeFinish < this.timeStart) {
    return next(new Error("timeFinish must be after timeStart"));
  }
  next();
});