import api from "./api";

export function createReview(data) {
  return api.post("/reviews", data).then((res) => res.data.review);
}

export function getReviews({ user, swap }) {
  const params = {};
  if (user) params.user = user;
  if (swap) params.swap = swap;
  return api.get("/reviews", { params }).then((res) => res.data.reviews);
}
