module.exports = function (email, date) {
  const pipeline = [];

  if (email && date) {
    pipeline.push([
      {
        $lookup: {
          from: "reports",
          localField: "_id",
          foreignField: "user",
          as: "reports",
        },
      },
      {
        $unwind: {
          path: "$reports",
          includeArrayIndex: "reportsIndx",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "carrierevaluationdatas",
          localField: "reports.carrier",
          foreignField: "carrier",
          as: "carriers",
        },
      },
      {
        $unwind: {
          path: "$carriers",
          includeArrayIndex: "carriersIndx",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          email: email,
        },
      },
      {
        $match: {
          "reports.createdAt": {
            $gte: new Date(date),
          },
        },
      },
      {
        $sort: {
          "reports.createdAt": -1,
        },
      },
      {
        $project: {
          name: {
            $trim: {
              input: {
                $concat: [
                  {
                    $concat: [
                      {
                        $toUpper: {
                          $substrCP: [
                            "$firstName",
                            0,
                            1,
                          ],
                        },
                      },
                      {
                        $substrCP: [
                          "$firstName",
                          1,
                          {
                            $strLenCP: "$firstName",
                          },
                        ],
                      },
                    ],
                  },
                  " ",
                  {
                    $concat: [
                      {
                        $toUpper: {
                          $substrCP: [
                            "$lastName",
                            0,
                            1,
                          ],
                        },
                      },
                      {
                        $substrCP: [
                          "$lastName",
                          1,
                          {
                            $strLenCP: "$lastName",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          userEmail: "$email",
          username: "$username",
          businessName: "$businessName",
          carrierName: "$carriers.name",
          dotNumber: "$carriers.dotNumber",
          mcNumber: "$carriers.mcNumber",
          reportReason: "$reports.reason",
          reportCreationDate: "$reports.createdAt",
          reportComment: "$reports.comment",
          approvedByAdmin: "$reports.approvedByAdmin",
          reviewedByAdmin: "$reports.reviewedByAdmin",
        },
      },
    ]);
  }
  else {
    throw new Error("You must provide at least one field to query.");
  }

  return pipeline;
};