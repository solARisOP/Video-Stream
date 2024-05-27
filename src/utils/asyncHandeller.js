export const asyncHandeler = (requestHandeler) => async (req, res, next) => {
    Promise.resolve(requestHandeler(req, res, next))
    .catch(error=>next(error));
}