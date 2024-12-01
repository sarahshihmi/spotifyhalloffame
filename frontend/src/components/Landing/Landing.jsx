import './Landing.css';
import myHeadshot from '../../../dist/assets/sarahpic1.jpg'
import { FaGithub, FaSpotify, FaLinkedin } from 'react-icons/fa';

const Landing = () => {
    return (
        <div className="landing-layout">

            <div className="landing-top">
                <div className="landing-title">One Artist, One Song.</div>
                <div className="landing-subtitle">Welcome to your Spotify Hall of Fame.</div>
                <button className="landing-button"onClick={() => (window.location.href = '/api/spotify/login')}>Enter now</button>
            </div>


            <hr className="landing-divider" />


            <div className="landing-mid">
                <div className="landing-description">
                    What is the Spotify Hall of Fame?
                </div>
                <div className="landing-description">
                    The definition of "best" is as follows:
                </div>
                <div className="landing-quote">
                    adjective<br />
                    excelling all others<br />
                    "the best student in the class"
                </div>
                <div className="landing-description">
                    No, we will not have the best SONGS from an artist, because "best" requires there to be ONE. This hall of fame encourages you to take a deep dive into an artist's discography and choose the BEST song that you think is deserving of this title.
                </div>
                <div className="landing-italics">
                    "Wait, but I want more than one song for each artist in my Hall of Fame!"
                </div>
                <div className="landing-description">
                    Aw shucks. Guess you don't know the definition of best.
                </div>
                <div className="landing-italics">
                    Ok, but what if I have 10 songs from one artist and I don't listen to anyone else?!
                </div>
                <div className="landing-description">
                    Ok FINE, if you log in, you also have access to a "Top 10 All-Time" List where you get to decide your top 10 songs of all time. You can only have one best song at the top though!
                </div>
            </div>


            <hr className="landing-divider" />

  
            <div className="landing-bottom">
                <img src={myHeadshot} alt="Sarah's Headshot" className="landing-headshot" />
                <div className="landing-about-head">About Me:</div>
                <div className="landing-about-text">
                    My name is Sarah Shih Milinovich! I am a full-stack coder, a lover of lists, and a music fiend. My Hall of Fame includes Starfall by Illenium, Feel Special by TWICE, Legends Never Die by League of Legends, and Say by Keshi. Let's connect!
                </div>
                <div className="landing-socials">
                    <a href="https://github.com/sarahshihmi/spotifyhalloffame" className="landing-icon">
                            <FaGithub />
                        </a>
                        <a href="https://open.spotify.com/user/sarahmeowshih" className="landing-icon">
                            <FaSpotify />
                        </a>
                        <a href="https://www.linkedin.com/in/sarahashih/" className="landing-icon">
                            <FaLinkedin />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Landing;
