
import '../../mc-viewer';
import { LitElement, html } from 'lit-element';

class DemoPage extends LitElement
{
    static get is()
    {
        return 'demo-page';
    }

    render() 
    {
        return html`
            <style>
            
                :host
                {
                    display: block;
                    margin: 0px;
                    padding: 10px;
                }

                .container
                {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

            </style>
            
            <div class="container">

                <mc-viewer 
                    src="./schematics/tree.schem" 
                    camera-controls
                    auto-rotate
                    shadow-intensity="0.3"
                    style="height: calc(100vh - 50px); width: calc(100vh - 50px);"
                ></mc-viewer>
                
            </div>
        `;
    }
}

customElements.define(DemoPage.is, DemoPage);