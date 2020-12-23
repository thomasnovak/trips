import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

function formatName(name) {
    return name.replace(/\s/g, '-').toLowerCase();
};

function findReport(reportId, userInfo) {
    return userInfo.reports.find(report => {
        return report.id == reportId;
    });
};

function findPictureReport(reportId, userInfo) {
    return userInfo.pitchReports.find(report => {
        return report.id == reportId;
    });
};

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('trips');

        await operations(db);

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

app.get('/:user/trip-reports/:id', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;
        const reportId = req.params.id;

        const userInfo = await db.collection('users').findOne({user: userName});

        const reportInfo = findReport(reportId, userInfo);

        res.status(200).json(reportInfo);
    }, res);
});

app.get('/:user/picture-trip-reports/:id', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;
        const reportId = req.params.id;

        const userInfo = await db.collection('users').findOne({user: userName});

        const reportInfo = findPictureReport(reportId, userInfo);

        res.status(200).json(reportInfo);
    }, res);
});

app.get('/:user/trip-reports', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;

        const userInfo = await db.collection('users').findOne({user: userName});
        res.status(200).json(userInfo);
    }, res);
});

app.get('/:user/picture-trip-reports', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;

        const userInfo = await db.collection('users').findOne({user: userName});
        res.status(200).json(userInfo);
    }, res);
});

app.post('/api/:user/trip-reports/:id/upvote', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;
        const reportId = req.params.id;
        const userInfo = await db.collection('users').findOne({user: userName});
        const reportInfo = findReport(reportId, userInfo);

        await db.collection('users').updateOne(
            { user: userName, "reports.id":  reportId }, {
            '$set': { "reports.$.upvotes": reportInfo.upvotes + 1 }
        });

        const updatedUserInfo = await db.collection('users').findOne({user: userName});

        const updatedReportInfo = findReport(reportId, updatedUserInfo);

        res.status(200).json(updatedUserInfo);    
    }, res);
});

app.post('/api/:user/picture-trip-reports/:id/upvote', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;
        const reportId = req.params.id;
        const userInfo = await db.collection('users').findOne({user: userName});
        const reportInfo = findPictureReport(reportId, userInfo);

        await db.collection('users').updateOne(
            { user: userName, "pitchReports.id":  reportId }, {
            '$set': { "pitchReports.$.upvotes": reportInfo.upvotes + 1 }
        });

        const updatedUserInfo = await db.collection('users').findOne({user: userName});

        const updatedReportInfo = findReport(reportId, updatedUserInfo);

        res.status(200).json(updatedUserInfo);    
    }, res);
});

app.post('/api/:user/trip-reports/:id/update', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;
        const reportID = req.params.id;
        const { report } = req.body;

        await db.collection('users').updateOne(
            { user: userName, "reports.id":  reportID }, {
            '$set': { "reports.$": report }
        });
        
        const updatedUserInfo = await db.collection('users').findOne({user: userName});

        res.status(200).json(updatedUserInfo);    
    }, res)
});

app.post('/api/:user/picture-trip-reports/:id/update', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;
        const reportID = req.params.id;
        const { report } = req.body;

        await db.collection('users').updateOne(
            { user: userName, "pitchReports.id":  reportID }, {
            '$set': { "pitchReports.$": report }
        });
        
        const updatedUserInfo = await db.collection('users').findOne({user: userName});

        res.status(200).json(updatedUserInfo);    
    }, res)
});

app.post('/api/:user/trip-reports/:id/delete', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;
        const reportID = req.params.id;
        await db.collection('users').updateOne(
            { user: userName, "reports.id":  reportID }, {
            '$pull': { reports: { id: reportID } }
        });
        const updatedUserInfo = await db.collection('users').findOne({user: userName});

        res.status(200).json(updatedUserInfo);    
    }, res)
});

app.post('/api/:user/picture-trip-reports/:id/delete', async (req, res) => {
    withDB(async (db) => {
        const userName = req.params.user;
        const reportID = req.params.id;
        await db.collection('users').updateOne(
            { user: userName, "pitchReports.id":  reportID }, {
            '$pull': { pitchReports: { id: reportID } }
        });
        const updatedUserInfo = await db.collection('users').findOne({user: userName});

        res.status(200).json(updatedUserInfo);    
    }, res)
});


app.post('/api/:user/trip-reports/submit', async (req, res) => {

    const { report } = req.body;
    const userName = req.params.user;

    withDB(async (db) => {
        const userInfo = await db.collection('users').findOne({user: userName});
        await db.collection('users').updateOne(
            { user: userName }, {
            '$set': { 
                reports: userInfo.reports.concat(report),
            },
        });
        const updatedUserInfo = await db.collection('users').findOne({user: userName});
        res.status(200).json(updatedUserInfo);    
    }, res);
});

app.post('/api/:user/picture-trip-reports/submit', async (req, res) => {

    const { report } = req.body;
    const userName = req.params.user;

    withDB(async (db) => {
        const userInfo = await db.collection('users').findOne({user: userName});
        await db.collection('users').updateOne(
            { user: userName }, {
            '$set': { 
                pitchReports: userInfo.pitchReports.concat(report),
            },
        });
        const updatedUserInfo = await db.collection('users').findOne({user: userName});
        res.status(200).json(updatedUserInfo);    
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000'));